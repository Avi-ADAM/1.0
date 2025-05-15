# שלב הבנייה
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# שלב ההרצה
FROM node:18

WORKDIR /app

COPY --from=build /app ./

ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
