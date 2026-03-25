import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`[AJ Map API] Server running on http://localhost:${port}`);
});
