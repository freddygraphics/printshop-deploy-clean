const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "info@freddygraphics.com";
  const newPassword = "123456";

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hash,
    },
  });

  console.log("✅ Password actualizado");
  console.log("email:", email);
  console.log("password:", newPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
