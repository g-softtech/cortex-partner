import { describe, it, expect } from "vitest";

export function calculatePagination(pageInput: string | undefined, totalRecords: number, pageSize: number = 10) {
  const parsedPage = parseInt(pageInput ?? "1", 10);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const safePage = totalPages > 0 && page > totalPages ? totalPages : page;
  const skip = (safePage - 1) * pageSize;
  const from = totalRecords === 0 ? 0 : skip + 1;
  const to = Math.min(skip + pageSize, totalRecords);

  return {
    page: safePage,
    pageSize,
    totalRecords,
    totalPages,
    skip,
    from,
    to,
    hasPrevious: safePage > 1,
    hasNext: totalPages > 0 && safePage < totalPages,
  };
}

describe("Pagination Calculation Rules", () => {
  it("handles missing page parameter defaulting to page 1", () => {
    const res = calculatePagination(undefined, 38, 10);
    expect(res.page).toBe(1);
    expect(res.skip).toBe(0);
    expect(res.from).toBe(1);
    expect(res.to).toBe(10);
    expect(res.totalPages).toBe(4);
    expect(res.hasPrevious).toBe(false);
    expect(res.hasNext).toBe(true);
  });

  it("handles page 0 by defaulting to page 1", () => {
    const res = calculatePagination("0", 38, 10);
    expect(res.page).toBe(1);
    expect(res.skip).toBe(0);
  });

  it("handles negative page numbers by defaulting to page 1", () => {
    const res = calculatePagination("-5", 38, 10);
    expect(res.page).toBe(1);
    expect(res.skip).toBe(0);
  });

  it("handles non-numeric invalid string by defaulting to page 1", () => {
    const res = calculatePagination("invalid", 38, 10);
    expect(res.page).toBe(1);
    expect(res.skip).toBe(0);
  });

  it("calculates page 2 skip correctly", () => {
    const res = calculatePagination("2", 38, 10);
    expect(res.page).toBe(2);
    expect(res.skip).toBe(10);
    expect(res.from).toBe(11);
    expect(res.to).toBe(20);
    expect(res.hasPrevious).toBe(true);
    expect(res.hasNext).toBe(true);
  });

  it("calculates final page bounds correctly", () => {
    const res = calculatePagination("4", 38, 10);
    expect(res.page).toBe(4);
    expect(res.skip).toBe(30);
    expect(res.from).toBe(31);
    expect(res.to).toBe(38);
    expect(res.hasPrevious).toBe(true);
    expect(res.hasNext).toBe(false);
  });

  it("clamps page number exceeding totalPages to last page", () => {
    const res = calculatePagination("99", 38, 10);
    expect(res.page).toBe(4);
    expect(res.from).toBe(31);
    expect(res.to).toBe(38);
    expect(res.hasNext).toBe(false);
  });

  it("handles zero total records safely", () => {
    const res = calculatePagination("1", 0, 10);
    expect(res.page).toBe(1);
    expect(res.totalPages).toBe(0);
    expect(res.from).toBe(0);
    expect(res.to).toBe(0);
    expect(res.hasPrevious).toBe(false);
    expect(res.hasNext).toBe(false);
  });
});
