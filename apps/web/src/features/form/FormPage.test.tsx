import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FormPage from "./FormPage";
import { ExportLeadProvider } from "../landing/StartExportingModal";

/**
 * Component test for the public assessment form.
 *
 * The form has two independent gates that live OUTSIDE React Hook Form:
 *   - the catalogue file/link (stored in component state, not a RHF field)
 *   - the Privacy Policy consent checkbox (same)
 * These run inside `onSubmit` (when RHF passes) and `onInvalid` (when it fails),
 * so we exercise both paths. We mock only the `lib/api` boundary
 * (`validateInvite` + `submitAssessment`); the real Zod schema and the real
 * gate logic are exercised end-to-end.
 */

const api = vi.hoisted(() => ({
  validateInvite: vi.fn(),
  submitAssessment: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  validateInvite: api.validateInvite,
  submitAssessment: api.submitAssessment,
}));

function renderForm() {
  return render(
    <ExportLeadProvider>
      <MemoryRouter initialEntries={["/assessment?invite=valid-token"]}>
        <FormPage />
      </MemoryRouter>
    </ExportLeadProvider>,
  );
}

/** Locate the control (input/textarea/button) for a labelled field. */
function controlFor(label: RegExp): HTMLElement {
  const labelEl = screen.getByText(label, { selector: "span" });
  const wrapper = labelEl.closest("div");
  const el = wrapper?.querySelector("input, textarea, button");
  if (!el) throw new Error(`No control found for label ${label}`);
  return el as HTMLElement;
}

function fillText(label: RegExp, value: string) {
  const el = controlFor(label) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.change(el, { target: { value } });
}

/** Open a SelectField's popover and choose its first option. */
function pickFirstOption(label: RegExp) {
  const trigger = controlFor(label) as HTMLButtonElement;
  fireEvent.click(trigger);
  const popover = trigger.parentElement?.querySelector("div");
  const option = popover?.querySelector("button");
  if (!option) throw new Error(`No option button found for ${label}`);
  fireEvent.click(option as HTMLButtonElement);
}

function attachFile(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error("File input not found");
  const file = new File(["dummy catalogue"], "sample-catalogue.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
}

function acceptConsent() {
  const cb = screen.getByRole("checkbox") as HTMLInputElement;
  fireEvent.click(cb);
}

/**
 * Fill every required field with valid values. Picking "Yes" for the GCC-activity
 * combobox makes the GCC-situation textarea render (it's conditionally shown), so
 * we wait for it before filling.
 */
async function fillAllRequiredFields() {
  fillText(/Company Name/, "Nordic Berries Oy");
  fillText(/Website/, "https://nordicberries.example.com");
  fillText(/Industry \/ Product Category/, "Beverages");
  fillText(/Years in Business/, "12 years");
  fillText(/Current Export Markets/, "Sweden, Germany");
  fillText(/Label Languages Currently Available/, "Finnish, English");
  fillText(/Lead Times/, "3–4 weeks");
  fillText(/Minimum Order Quantity/, "1 pallet");
  fillText(/Full Name/, "Test User");
  fillText(/Title \/ Position/, "Export Director");
  fillText(/Email Address/, "test@example.com");
  fillText(/Phone Number/, "+358 40 123 4567");
  fillText(/Anything Else\?/, "Test submission.");

  pickFirstOption(/Country/);
  pickFirstOption(/Annual Revenue/);
  pickFirstOption(/Shelf Life/);
  pickFirstOption(/Frozen Storage Required\?/);
  pickFirstOption(/Halal Certification/);
  pickFirstOption(/SFDA or ADAFSA Product Registration/);
  pickFirstOption(/Product Adaptability/);
  pickFirstOption(/Branding & Promotional Approach/);
  pickFirstOption(/Currently Active in Any GCC Market\?/);

  // Selecting "Yes" reveals the required GCC-situation textarea.
  const gccLabel = await screen.findByText(/Describe Your Current GCC Situation/, { selector: "span" });
  const gccEl = gccLabel.closest("div")?.querySelector("textarea") as HTMLTextAreaElement;
  fireEvent.change(gccEl, {
    target: { value: "Currently exporting to the UAE via a local distributor." },
  });

  pickFirstOption(/Dedicated Export Contact\?/);
  pickFirstOption(/Can You Dedicate Production Capacity to a New Export Market\?/);
}

beforeEach(() => {
  vi.clearAllMocks();
  api.validateInvite.mockResolvedValue({ valid: true, purpose: "ASSESSMENT" });
  api.submitAssessment.mockResolvedValue(undefined);
  // jsdom doesn't implement these; the form's scroll-to-error helper needs them.
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
  (globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame = (
    cb,
  ) => {
    cb(0);
    return 0;
  };
});

describe("FormPage", () => {
  it("shows the invite-only screen and never renders the form for an invalid token", async () => {
    api.validateInvite.mockResolvedValue({ valid: false });

    renderForm();

    expect(await screen.findByText(/This assessment is invite-only/i)).toBeTruthy();
    expect(screen.queryByText("Submit Assessment")).toBeNull();
    expect(api.submitAssessment).not.toHaveBeenCalled();
  });

  it("blocks an empty submission and lists the missing fields without calling the API", async () => {
    renderForm();
    await screen.findByText("Submit Assessment");

    fireEvent.click(screen.getByText("Submit Assessment"));

    expect(await screen.findByText(/Please complete the following/i)).toBeTruthy();
    // The banner lists the missing field as a <li>; the label ("Company Name") and the
    // inline error ("Company name is required") also contain the phrase, so match exactly.
    expect(screen.getByText("Company name")).toBeTruthy();
    expect(api.submitAssessment).not.toHaveBeenCalled();
  });

  it("blocks submission when the file and consent are missing, even with every field filled", async () => {
    renderForm();
    await screen.findByText("Submit Assessment");
    await fillAllRequiredFields();

    fireEvent.click(screen.getByText("Submit Assessment"));

    expect(await screen.findByText(/Please complete the following/i)).toBeTruthy();
    expect(screen.getByText(/Attach your export catalogue/i)).toBeTruthy();
    expect(screen.getByText(/Accept the Privacy Policy/i)).toBeTruthy();
    expect(api.submitAssessment).not.toHaveBeenCalled();
    // Sanity: the file was never attached, so the success screen must not show.
    expect(screen.queryByText(/Thank you — submission received/i)).toBeNull();
  });

  it("submits the payload and shows the thank-you screen when the form is complete", async () => {
    const { container } = renderForm();
    await screen.findByText("Submit Assessment");
    await fillAllRequiredFields();
    attachFile(container);
    acceptConsent();

    fireEvent.click(screen.getByText("Submit Assessment"));

    expect(await screen.findByText(/Thank you — submission received/i)).toBeTruthy();

    expect(api.submitAssessment).toHaveBeenCalledTimes(1);
    const [payload, sentFiles, sentToken] = api.submitAssessment.mock.calls[0];
    expect(sentToken).toBe("valid-token");
    expect(sentFiles).toHaveLength(1);
    expect((sentFiles[0] as File).name).toBe("sample-catalogue.pdf");
    expect(payload.companyName).toBe("Nordic Berries Oy");
    expect(payload.contactEmail).toBe("test@example.com");
    expect(payload.gccCurrentlyActive).toBe(true);
  });
});
