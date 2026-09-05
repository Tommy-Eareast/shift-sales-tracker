import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth: Login (password grant)
  http.post("*/auth/v1/token*", () => {
    return HttpResponse.json({
      access_token: "test-token",
      refresh_token: "test-refresh",
      user: { id: "user-2", email: "promoter@test.com" },
    });
  }),

  // Auth: Get current user
  http.get("*/auth/v1/user", () => {
    return HttpResponse.json({ id: "user-2", email: "promoter@test.com" });
  }),

  // Auth: Logout
  http.post("*/auth/v1/logout", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Profiles: Get all or by id
  http.get("*/rest/v1/profiles*", ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (idParam === "eq.user-1") {
      return HttpResponse.json({
        id: "user-1",
        email: "manager@test.com",
        display_name: "Test Manager",
        role: "manager",
        created_at: "2026-01-01",
      });
    }
    if (idParam === "eq.user-2") {
      return HttpResponse.json({
        id: "user-2",
        email: "promoter@test.com",
        display_name: "Test Promoter",
        role: "promoter",
        created_at: "2026-01-01",
      });
    }

    // Default: return list
    return HttpResponse.json([
      {
        id: "user-1",
        email: "manager@test.com",
        display_name: "Test Manager",
        role: "manager",
        created_at: "2026-01-01",
      },
      {
        id: "user-2",
        email: "promoter@test.com",
        display_name: "Test Promoter",
        role: "promoter",
        created_at: "2026-01-01",
      },
    ]);
  }),

  // Templates: Get all
  http.get("*/rest/v1/templates*", () => {
    return HttpResponse.json([
      {
        id: "tpl-1",
        name: "Interparfum",
        brand_list: ["Montblanc", "Coach"],
        sort_order: 0,
        created_at: "2026-01-01",
      },
      {
        id: "tpl-2",
        name: "Bvlgari",
        brand_list: ["Bvlgari"],
        sort_order: 1,
        created_at: "2026-01-01",
      },
    ]);
  }),

  // Templates: Create
  http.post("*/rest/v1/templates", () => {
    return HttpResponse.json({ id: "tpl-new", name: "New Template" });
  }),

  // Products: Get all
  http.get("*/rest/v1/products*", () => {
    return HttpResponse.json([
      {
        id: "prd-1",
        brand_main: "Montblanc",
        sub_category: "Explorer Series",
        full_name: "Explorer 100ml EDP",
        price: 185,
        sort_order: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      {
        id: "prd-2",
        brand_main: "Coach",
        sub_category: "Coach For Men",
        full_name: "Coach For Men EDT 100ml",
        price: 135,
        sort_order: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ]);
  }),

  // Products: Create
  http.post("*/rest/v1/products", () => {
    return HttpResponse.json({ id: "prd-new" });
  }),

  // Shifts: Get by id (single) — return single object
  http.get("*/rest/v1/shifts", ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (idParam === "eq.shift-1") {
      return HttpResponse.json({
        id: "shift-1",
        user_id: "user-2",
        template_id: "tpl-1",
        record_date: "2026-09-01",
        shift_display_name: "01/09/2026 Mon 07:00-12:00",
        time_start: "07:00",
        time_end: "12:00",
        status: "draft",
        note: "",
        submitted_at: null,
        created_at: "2026-09-01",
      });
    }
    if (idParam === "eq.shift-2") {
      return HttpResponse.json({
        id: "shift-2",
        user_id: "user-2",
        template_id: "tpl-1",
        record_date: "2026-08-31",
        shift_display_name: "31/08/2026 Sun 13:00-18:00",
        time_start: "13:00",
        time_end: "18:00",
        status: "submitted",
        note: "Good day",
        submitted_at: "2026-08-31T10:00:00Z",
        created_at: "2026-08-31",
      });
    }

    // Default: return list
    return HttpResponse.json([
      {
        id: "shift-1",
        user_id: "user-2",
        template_id: "tpl-1",
        record_date: "2026-09-01",
        shift_display_name: "01/09/2026 Mon 07:00-12:00",
        time_start: "07:00",
        time_end: "12:00",
        status: "draft",
        note: "",
        submitted_at: null,
        created_at: "2026-09-01",
      },
      {
        id: "shift-2",
        user_id: "user-2",
        template_id: "tpl-1",
        record_date: "2026-08-31",
        shift_display_name: "31/08/2026 Sun 13:00-18:00",
        time_start: "13:00",
        time_end: "18:00",
        status: "submitted",
        note: "Good day",
        submitted_at: "2026-08-31T10:00:00Z",
        created_at: "2026-08-31",
      },
    ]);
  }),

  // Shifts: Create
  http.post("*/rest/v1/shifts", () => {
    return HttpResponse.json({ id: "shift-new" });
  }),

  // Shifts: Update
  http.patch("*/rest/v1/shifts*", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Shifts: Delete
  http.delete("*/rest/v1/shifts*", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Shift sales: Get by shift
  http.get("*/rest/v1/shift_sales*", () => {
    return HttpResponse.json([
      {
        id: "sale-1",
        shift_id: "shift-1",
        product_id: "prd-1",
        sell_count: 2,
        price_at_submit: 185,
      },
      {
        id: "sale-2",
        shift_id: "shift-1",
        product_id: "prd-2",
        sell_count: 1,
        price_at_submit: 135,
      },
    ]);
  }),

  // Shift sales: Create
  http.post("*/rest/v1/shift_sales", () => {
    return HttpResponse.json({ id: "sale-new" });
  }),

  // Shift sales: Update
  http.patch("*/rest/v1/shift_sales*", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Shift sales: Delete
  http.delete("*/rest/v1/shift_sales*", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Submitted shifts
  http.post("*/rest/v1/submitted_shifts", () => {
    return HttpResponse.json({ id: "sub-1" });
  }),
  http.get("*/rest/v1/submitted_shifts*", () => {
    return HttpResponse.json([]);
  }),
];
