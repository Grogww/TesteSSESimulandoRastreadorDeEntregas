// backend/app.test.js
const request = require("supertest");
const app = require("./app");

describe("Delivery Tracker API", () => {
  test("GET /health responde 200 com status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("GET /api/deliveries retorna uma lista", async () => {
    const res = await request(app).get("/api/deliveries");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/deliveries cria uma entrega com deliveryId", async () => {
    const res = await request(app).post("/api/deliveries");
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("deliveryId");
  });

  test("GET stream de entrega inexistente retorna 404", async () => {
    const res = await request(app).get("/api/deliveries/INEXISTENTE/stream");
    expect(res.statusCode).toBe(404);
  });
});