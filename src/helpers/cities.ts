import { prisma } from '..';

const distanceBetweenPoints = (
  // Miles
  longitude1: number,
  latitude1: number,
  longitude2: number,
  latitude2: number,
) =>
  3959 *
  Math.acos(
    Math.sin((latitude1 * Math.PI) / 180) *
      Math.sin((latitude2 * Math.PI) / 180) +
      Math.cos((latitude1 * Math.PI) / 180) *
        Math.cos((latitude2 * Math.PI) / 180) *
        Math.cos(((longitude2 - longitude1) * Math.PI) / 180),
  );

export const citiesInRadius = async (
  longitude: number,
  latitude: number,
  distance: number, // Miles
) => {
  const longitudeInMiles =
    Math.cos(
      ((Math.abs(latitude) < distance
        ? 0
        : latitude < 0
        ? latitude + distance
        : latitude - distance) *
        Math.PI) /
        180,
    ) * 69.092;
  const rLongitude = distance / longitudeInMiles;
  const rLatitude = distance / 69.092;
  let maxLongitude = longitude + rLongitude;
  let minLongitude = longitude - rLongitude;
  let maxLatitude = latitude + rLatitude;
  let minLatitude = latitude - rLatitude;
  if (maxLongitude > 180) maxLongitude -= 360;
  if (minLongitude < -180) minLongitude += 360;
  if (maxLatitude > 90) maxLatitude -= 90;
  if (minLatitude < -90) minLatitude += 90;
  const possibilities = await prisma.city.findMany({
    where: {
      AND: [
        {
          [minLongitude < longitude && maxLongitude > longitude ? 'AND' : 'OR']:
            [
              {
                longitude: {
                  gt: minLongitude,
                },
              },
              {
                longitude: {
                  lt: maxLongitude,
                },
              },
            ],
        },
        {
          [minLatitude < latitude && maxLatitude > latitude ? 'AND' : 'OR']: [
            {
              latitude: {
                gt: minLatitude,
              },
            },
            {
              latitude: {
                lt: maxLatitude,
              },
            },
          ],
        },
      ],
    },
  });
  return possibilities
    .map((city) => ({
      ...city,
      distance: distanceBetweenPoints(
        longitude,
        latitude,
        city.longitude,
        city.latitude,
      ),
    }))
    .filter((city) => city.distance < distance)
    .sort((a, b) => a.distance - b.distance);
};
