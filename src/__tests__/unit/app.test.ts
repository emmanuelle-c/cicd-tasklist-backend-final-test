import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mocks for express and its helpers before importing the app module.
const mockUse = vi.fn();
const mockApp = { use: mockUse } as unknown as any;

const mockJson = vi.fn(() => "jsonMiddleware");
const mockExpressDefault = vi.fn(() => mockApp);
// attach json to the default export (express.json())
(mockExpressDefault as any).json = mockJson;

const mockRouterInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
};
const mockRouter = vi.fn(() => mockRouterInstance);

vi.mock("express", () => ({
    default: mockExpressDefault,
    Router: mockRouter,
}));

const mockCors = vi.fn(() => "corsMiddleware");
vi.mock("cors", () => ({ default: mockCors }));

describe("app", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("should configure cors, json middleware and mount /api/tasks route", async () => {
        // Import the app after setting up mocks so the module executes with them.
        const { default: app } = await import("../../app.js");

        expect(app).toBe(mockApp);

        expect(mockExpressDefault).toHaveBeenCalledTimes(1);

        expect(mockJson).toHaveBeenCalledTimes(1);
        expect(mockCors).toHaveBeenCalledTimes(1);

        expect(mockUse).toHaveBeenCalledTimes(3);

        // Verify the exact calls/order
        expect(mockUse.mock.calls[0][0]).toBe("corsMiddleware");
        expect(mockUse.mock.calls[1][0]).toBe("jsonMiddleware");

        // The third call should mount the tasks route under /api/tasks
        expect(mockUse.mock.calls[2][0]).toBe("/api/tasks");
        expect(mockUse.mock.calls[2][1]).toBeDefined();
    });
});
