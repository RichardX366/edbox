import { RequestHandler } from 'express';
import { prisma } from '..';
import { sendEmail } from '../helpers/nodemailer';
import { citiesInRadius } from '../helpers/cities';
import { City, Item, ItemType, Picture, Subject } from '@prisma/client';
import { bucket } from '../helpers/gcs';
import axios from 'axios';
// @ts-ignore
import Openrouteservice from 'openrouteservice-js';
const Directions = new Openrouteservice.Directions({
  api_key: process.env.ORS_KEY,
});

export const createItem: RequestHandler = async (req, res) => {
  const { user, name, description, pictures, city, address, subject, type } =
    req.body;
  res.json(
    await prisma.item.create({
      data: {
        user: { connect: { email: user } },
        name,
        description,
        pictures: {
          connect: pictures.map((picture: string) => ({ id: picture })),
        },
        city: { connect: { name: city } },
        address,
        subject: subject === 'N/A' ? null : subject,
        type: type === 'N/A' ? null : type,
      },
      include: {
        city: true,
        pictures: true,
      },
    }),
  );
};

export const deleteItem: RequestHandler = async (req, res) => {
  const { id } = req.params;
  await prisma.item.delete({ where: { id } });
  res.send('success');
};

export const requestItem: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userEmail } = req.body;
  const [item, user] = await prisma.$transaction([
    prisma.item.findUniqueOrThrow({
      where: { id },
      include: { user: true },
    }),
    prisma.user.findFirstOrThrow({
      where: { email: userEmail },
    }),
  ]);
  await sendEmail({
    to: item.user.email,
    subject: 'Item Request',
    html: `<p>Hello ${item.user.name},
${user.name} would like to contact you to pick up your ${item.name}. You can contact them at <a href="mailto:${user.email}">${user.email}</a>.
- EdBox</p>`
      .split('\n')
      .join('</p><p>'),
  });
  res.send('success');
};

export const updateItem: RequestHandler = async (req, res) => {
  const { subject, type } = req.body;
  res.json(
    await prisma.item.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        subject: subject === 'N/A' ? null : subject,
        type: type === 'N/A' ? null : type,
        city: { connect: { name: req.body.city } },
      },
      include: {
        city: true,
        pictures: true,
      },
    }),
  );
};

export const addPicture: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { pictureId } = req.body;
  res.json(
    await prisma.picture.update({
      where: { id: pictureId },
      data: { item: { connect: { id } } },
    }),
  );
};

export const makePrimary: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const picture = await prisma.picture.findUniqueOrThrow({
    where: { id },
    include: { item: true },
  });
  await prisma.$transaction([
    prisma.picture.updateMany({
      where: { itemId: picture.item?.id, id: { not: id } },
      data: { primary: false },
    }),
    prisma.picture.update({
      where: { id },
      data: { primary: true },
    }),
  ]);
  res.send('success');
};

export const deletePicture: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const picture = await prisma.picture.findUniqueOrThrow({
    where: { id },
    include: { item: { include: { pictures: true } } },
  });
  if (picture.item?.pictures.length === 1) {
    throw 'You must have at least 1 picture';
  }
  await prisma.picture.delete({
    where: { id },
  });
  if (picture.primary) {
    await prisma.item.update({
      where: { id: picture.itemId as string },
      data: {
        pictures: {
          update: {
            where: {
              id: picture.item?.pictures.filter(
                (picture) => picture.id !== id,
              )[0].id,
            },
            data: { primary: true },
          },
        },
      },
    });
  }
  res.send('success');
};

export const findItems: RequestHandler = async (req, res) => {
  const { cityName, longitude, latitude, name, distance, subject, type } =
    req.stringQuery;
  const city = await prisma.city.findUniqueOrThrow({
    where: { name: cityName },
  });
  const cities = (
    await citiesInRadius(city.longitude, city.latitude, +distance + 50)
  ).map(({ name }) => name);
  const results: (Item & {
    pictures: Picture[];
    city: City;
    distance: number;
  })[] = (
    await Promise.all(
      (
        await prisma.item.findMany({
          where: {
            city: { name: { in: cities } },
            name: { contains: name },
            subject: subject === 'Any' ? undefined : (subject as Subject),
            type: type === 'Any' ? undefined : (type as ItemType),
          },
          include: { pictures: true, city: true },
        })
      ).map(
        (item) =>
          new Promise(async (res) => {
            const result = await axios
              .get(
                `https://nominatim.openstreetmap.org/search?q=${item.address}&format=json`,
              )
              .then(
                (res) =>
                  res.data
                    .map((location: any) => ({
                      ...location,
                      distance:
                        Math.abs(+longitude - +location.lon) +
                        Math.abs(+latitude - +location.lat),
                    }))
                    .sort((a: any, b: any) => a.distance - b.distance)
                    .filter(
                      ({ class: locationClass }: any) =>
                        locationClass === 'place',
                    )[0],
              );
            if (!result) return res('');
            const { lon, lat } = result;
            res({
              ...item,
              distance: (
                await Directions.calculate({
                  coordinates: [
                    [+longitude, +latitude],
                    [+lon, +lat],
                  ],
                  profile: 'driving-car',
                  units: 'mi',
                  format: 'json',
                })
              ).routes[0].summary.distance,
              longitude: +lon,
              latitude: +lat,
            });
          }) as any,
      ),
    )
  ).filter(Boolean);
  res.json(
    results
      .filter(({ distance: locationDistance }) => locationDistance <= +distance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30),
  );
};

export const uploadPicture: RequestHandler = async (req, res) => {
  const { id } = await prisma.picture.create({ data: {} });
  const [url] = await bucket.file('edBox/' + id).getSignedUrl({
    action: 'write',
    expires: Date.now() + 10000,
    version: 'v4',
  });
  res.json({ id, url });
};
