const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const seedCities = async () => {
  const cities = await import('./cities.json', { assert: { type: 'json' } });
  const filteredCities = cities.default.reduce(
    (prev, curr) =>
      prev.find((city) => city.name === curr.name) ? prev : prev.concat(curr),
    [],
  );
  await prisma.$transaction(
    new Array(Math.ceil(filteredCities.length / 1000)).fill(0).map((_, i) =>
      prisma.city.createMany({
        data: filteredCities.slice(i * 1000, (i + 1) * 1000),
      }),
    ),
  );
  console.log('Created cities');
};

const main = async () => {
  await prisma.$transaction(
    Object.keys(prisma).map((model) => {
      if (model[0] === '_' || model.includes('$') || model === 'city') {
        return prisma.user.findUnique({ where: { email: '' } });
      }
      return prisma[model].deleteMany();
    }),
  );
  console.log('Deleted all data');
  // await seedCities();
  await prisma.user.create({
    data: {
      email: 'richardx366@gmail.com',
      name: 'Richard Xiong',
      password: 'password',
      city: {
        connect: {
          name: 'Trumbull Center, CT',
        },
      },
    },
  });
  console.log('Created user');
};

main();
