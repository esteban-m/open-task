FROM node:20-alpine

WORKDIR /app

# Copie intégrale depuis l'image qui fonctionnait (sources + node_modules verrouillés)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
