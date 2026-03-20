/**
 * Tests for useFloorPlanStore (Commit 4).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFloorPlanStore } from "./useFloorPlanStore";

// ---------------------------------------------------------------------------
// Mock the API service
// ---------------------------------------------------------------------------

vi.mock("@/services/api", () => ({
    generateFloorPlan: vi.fn(),
}));

vi.mock("@/services/recentProjects", () => ({
    saveRecentProject: vi.fn(),
}));

import { generateFloorPlan } from "@/services/api";
const mockedGenerate = vi.mocked(generateFloorPlan);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getState() {
    return useFloorPlanStore.getState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFloorPlanStore", () => {
    beforeEach(() => {
        // Reset store to initial state before every test
        getState().reset();
        vi.clearAllMocks();
    });

    // ---- Initial state ---------------------------------------------------

    describe("initial state", () => {
        it("has null floorPlan", () => {
            expect(getState().floorPlan).toBeNull();
        });

        it("has null projectId", () => {
            expect(getState().projectId).toBeNull();
        });

        it("has empty messages", () => {
            expect(getState().messages).toEqual([]);
        });

        it("has viewMode 'generate'", () => {
            expect(getState().viewMode).toBe("generate");
        });

        it("has viewerTab '2d'", () => {
            expect(getState().viewerTab).toBe("2d");
        });

        it("is not loading", () => {
            expect(getState().isLoading).toBe(false);
        });

        it("has no error", () => {
            expect(getState().error).toBeNull();
        });
    });

    // ---- Setters ---------------------------------------------------------

    describe("setViewMode", () => {
        it("updates viewMode", () => {
            getState().setViewMode("view3d");
            expect(getState().viewMode).toBe("view3d");
        });
    });

    describe("setViewerTab", () => {
        it("updates viewerTab", () => {
            getState().setViewerTab("3d");
            expect(getState().viewerTab).toBe("3d");
        });
    });

    describe("clearError", () => {
        it("clears the error", () => {
            // Manually inject an error
            useFloorPlanStore.setState({ error: "something broke" });
            expect(getState().error).toBe("something broke");
            getState().clearError();
            expect(getState().error).toBeNull();
        });
    });

    describe("reset", () => {
        it("restores initial state", () => {
            useFloorPlanStore.setState({
                viewMode: "view3d",
                viewerTab: "3d",
                error: "oops",
                isLoading: true,
            });
            getState().reset();
            expect(getState().viewMode).toBe("generate");
            expect(getState().viewerTab).toBe("2d");
            expect(getState().error).toBeNull();
            expect(getState().isLoading).toBe(false);
        });
    });

    // ---- generatePlan ----------------------------------------------------

    describe("generatePlan — success", () => {
        const mockResponse = {
            project_id: "test-project-123",
            floorplan: {
                name: "Test Plan",
                levels: [
                    {
                        level_number: 0,
                        name: "Ground Floor",
                        height: 2.8,
                        rooms: [],
                        walls: [],
                        doors: [],
                        windows: [],
                    },
                ],
                total_area: 50,
                width: 10,
                height: 5,
                metadata: {},
            },
            message: "Generated a floor plan with 2 rooms.",
        };

        beforeEach(() => {
            mockedGenerate.mockResolvedValue(mockResponse);
        });

        it("adds a user message", async () => {
            await getState().generatePlan("2 bedrooms");
            const userMsg = getState().messages.find((m) => m.role === "user");
            expect(userMsg).toBeDefined();
            expect(userMsg!.content).toBe("2 bedrooms");
        });

        it("calls the API with the prompt", async () => {
            await getState().generatePlan("2 bedrooms");
            expect(mockedGenerate).toHaveBeenCalledWith("2 bedrooms", undefined, undefined);
        });

        it("sets floorPlan from response", async () => {
            await getState().generatePlan("2 bedrooms");
            expect(getState().floorPlan).toEqual(mockResponse.floorplan);
        });

        it("sets projectId from response", async () => {
            await getState().generatePlan("2 bedrooms");
            expect(getState().projectId).toBe("test-project-123");
        });

        it("adds an assistant message", async () => {
            await getState().generatePlan("2 bedrooms");
            const assistantMsg = getState().messages.find(
                (m) => m.role === "assistant",
            );
            expect(assistantMsg).toBeDefined();
            expect(assistantMsg!.content).toBe(mockResponse.message);
        });

        it("switches viewMode to view2d", async () => {
            await getState().generatePlan("2 bedrooms");
            expect(getState().viewMode).toBe("view2d");
        });

        it("sets isLoading back to false", async () => {
            await getState().generatePlan("2 bedrooms");
            expect(getState().isLoading).toBe(false);
        });
    });

    describe("generatePlan — API error", () => {
        beforeEach(() => {
            mockedGenerate.mockRejectedValue(new Error("Network error"));
        });

        it("sets error state", async () => {
            await getState().generatePlan("fail");
            expect(getState().error).toBe("Network error");
        });

        it("adds error assistant message", async () => {
            await getState().generatePlan("fail");
            const msgs = getState().messages.filter((m) => m.role === "assistant");
            expect(msgs.length).toBe(1);
            expect(msgs[0].content).toContain("Network error");
        });

        it("sets isLoading back to false", async () => {
            await getState().generatePlan("fail");
            expect(getState().isLoading).toBe(false);
        });
    });
});
