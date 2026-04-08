This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

In any consol or terminal running on a Linux Machine
Navigate to the web-app folder

Then install the dependancies using
```
pip install .
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Note that if the port is busy, you may need to change the port that the website is hosted on or end a process that is running on the port

In order to end the process
```bash
lsof  -i :3000 # Or your differently selected port number
# See what values omces up and kill the one thats running on the port
kill -9 78921 # 78921 is an example number
```

## Stripe Environment Set-Up
### Changing the stripe API Key
In order to properly use the Stripe API for your buisisness you must replace the key in the .env with the one that stripe gives to you

It is also to be noted that the metadata is heavily relied on and if the invoices are not tagged correctly then the incorrect lights may turn on or may not turn on at all

## Expanding the Scope
If you want to expand the scope of this project, you can simply look at the current instantiated:
Event-app.py scripts
route.ts
pages.tsx
publish.py


You can start editing the UI page by modifying `app/page.tsx`.
