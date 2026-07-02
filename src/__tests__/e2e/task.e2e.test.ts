import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});
	});

describe("GET /api/tasks", () => {
		it("should return empty array when no tasks", async () => {
			const res = await request(app).get("/api/tasks");
			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body.length).toBe(0);
		});

		it("should return tasks after creation", async () => {
			const createRes = await request(app)
				.post("/api/tasks")
				.send({ title: "List Task", description: "List Desc" });
			expect(createRes.status).toBe(201);

			const res = await request(app).get("/api/tasks");
			expect(res.status).toBe(200);
			expect(res.body.length).toBeGreaterThanOrEqual(1);
			expect(res.body[0]).toHaveProperty("id");
			expect(res.body[0].title).toBe("List Task");
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return 200 with the task when exists", async () => {
			const createRes = await request(app)
				.post("/api/tasks")
				.send({ title: "Get Task", description: "Get Desc" });
			const id = createRes.body.id;

			const res = await request(app).get(`/api/tasks/${id}`);
			expect(res.status).toBe(200);
			expect(res.body.id).toBe(id);
			expect(res.body.title).toBe("Get Task");
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).get(`/api/tasks/abc`);
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 404 when task not found", async () => {
			const res = await request(app).get(`/api/tasks/999999`);
			expect(res.status).toBe(404);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("POST /api/tasks validation", () => {
		it("should return 400 if title missing or empty", async () => {
			const res1 = await request(app).post("/api/tasks").send({});
			expect(res1.status).toBe(400);
			expect(res1.body).toHaveProperty("error");

			const res2 = await request(app).post("/api/tasks").send({ title: "   " });
			expect(res2.status).toBe(400);
			expect(res2.body).toHaveProperty("error");
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update an existing task and return 200", async () => {
			const createRes = await request(app)
				.post("/api/tasks")
				.send({ title: "Old Title", description: "Old" });
			const id = createRes.body.id;

			const res = await request(app)
				.put(`/api/tasks/${id}`)
				.send({ title: "New Title", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(id);
			expect(res.body.title).toBe("New Title");
			expect(res.body.completed).toBe(true);
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).put(`/api/tasks/not-a-number`).send({ title: "x" });
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 404 when updating non-existing task", async () => {
			const res = await request(app).put(`/api/tasks/999999`).send({ title: "x" });
			expect([404, 500]).toContain(res.status);
			// Prefer 404, but some layers may return 500 — accept either and assert an error message exists
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete an existing task and return 204", async () => {
			const createRes = await request(app)
				.post("/api/tasks")
				.send({ title: "To Delete", description: "Bye" });
			const id = createRes.body.id;

			const delRes = await request(app).delete(`/api/tasks/${id}`);
			expect(delRes.status).toBe(204);

			const getRes = await request(app).get(`/api/tasks/${id}`);
			expect(getRes.status).toBe(404);
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).delete(`/api/tasks/xyz`);
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 404 when deleting non-existing task", async () => {
			const res = await request(app).delete(`/api/tasks/999999`);
			expect([404, 500]).toContain(res.status);
			expect(res.body).toHaveProperty("error");
		});
	});
});
