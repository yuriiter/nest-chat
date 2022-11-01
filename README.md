# Backend for real-time chat application

This backend was made for [this React application](https://github.com/yuriiter/react-chat).

## How to run

You need to have Docker installed.
In the project directory, run:
```
npm i
docker compose up dev-db -d
npx prisma db push
npm run start
```
