import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { POST as recommendPost } from "../app/api/recommend/route";
import { GET as usersGet } from "../app/api/users/route";
import { getStore } from "../core/data";

describe("API Route Handlers", () => {
  beforeAll(() => {
    // Warm up the store
    getStore();
  });

  it("should respond to GET /api/users with a list of user profiles", async () => {
    const res = await usersGet();
    expect(res.status).toBe(200);
    
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("user_id");
    expect(body[0]).toHaveProperty("home_airport");
  });

  it("should respond to POST /api/recommend with single-leg recommendation", async () => {
    const payload = {
      userId: "U01",
      requestText: "Get me to Tokyo",
      destination: "NRT",
    };

    const req = new NextRequest("http://localhost:3000/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await recommendPost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.mode).toBe("single-leg");
    expect(data).toHaveProperty("verdict");
    expect(data).toHaveProperty("ranked");
    expect(data).toHaveProperty("preference");
    expect(data).toHaveProperty("alternatives");
    expect(data).toHaveProperty("counterfactuals");
    expect(data).toHaveProperty("confidence");
    expect(data).toHaveProperty("trace");
    expect(data).toHaveProperty("explanation");
    
    // Check trace structure
    expect(data.trace.length).toBeGreaterThan(0);
    expect(data.trace[0]).toHaveProperty("id");
    expect(data.trace[0]).toHaveProperty("label");
    expect(data.trace[0]).toHaveProperty("payload");
  });

  it("should respond to POST /api/recommend with multi-city recommendation", async () => {
    const payload = {
      userId: "U02",
      requestText: "Multi-city tour of Europe",
      cities: ["LHR", "CDG", "FCO"],
    };

    const req = new NextRequest("http://localhost:3000/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await recommendPost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.mode).toBe("multi-city");
    expect(data).toHaveProperty("itinerary");
    expect(data.itinerary.legs.length).toBe(4); // MEX -> LHR -> CDG -> FCO -> MEX
  });
});
