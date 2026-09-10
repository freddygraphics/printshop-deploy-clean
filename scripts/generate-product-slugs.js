const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name, productId) {
  const baseSlug = slugify(name);

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === productId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Found ${products.length} products.`);

  for (const product of products) {
    // No tocar productos que ya tengan slug
    if (product.slug) {
      console.log(`SKIP #${product.id} "${product.name}" -> ${product.slug}`);
      continue;
    }

    const slug = await generateUniqueSlug(product.name, product.id);

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        slug,
      },
    });

    console.log(`OK #${product.id} "${product.name}" -> ${slug}`);
  }

  console.log("\nProduct slugs generated successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
