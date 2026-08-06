import { useState } from "react";
import { importDistributors } from "../../lib/api";

interface Props {
  onDone: () => void;
}

export default function CsvImport({ onDone }: Props) {
  const [raw, setRaw] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  const parseAndImport = async () => {
    setError(null);
    setResult(null);

    // Simple CSV parser: first line is headers, rest are rows
    const lines = raw.trim().split("\n").filter(Boolean);
    if (lines.length < 2) {
      setError("CSV must have a header row and at least one data row.");
      return;
    }

    const headers = parseLine(lines[0]!).map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => parseLine(line));

    // Map CSV headers to distributor fields
    const fieldMap: Record<string, string> = {
      "company name": "companyName",
      "company": "companyName",
      "city / region": "cityRegion",
      "city/region": "cityRegion",
      "city region": "cityRegion",
      "region": "cityRegion",
      "city": "cityRegion",
      "channel / type": "channelType",
      "channel/type": "channelType",
      "channel type": "channelType",
      "channel": "channelType",
      "type": "channelType",
      "size / scale": "sizeScale",
      "size/scale": "sizeScale",
      "size scale": "sizeScale",
      "scale": "sizeScale",
      "size": "sizeScale",
      "website": "website",
      "phone": "phone",
      "email": "email",
      "contact person": "contactPerson",
      "contact": "contactPerson",
      "do we know them?": "doWeKnowThem",
      "do we know them": "doWeKnowThem",
      "know them": "doWeKnowThem",
      "status / last contact": "statusLastContact",
      "status/last contact": "statusLastContact",
      "status last contact": "statusLastContact",
      "status": "statusLastContact",
      "last contact": "statusLastContact",
      "description": "description",
    };

    const mappedHeaders = headers.map((h) => {
    // attributes.* headers pass through as-is
    if (h.startsWith("attributes.")) return h;
    return fieldMap[h] ?? null;
  });

    const missingRequired = ["companyName", "cityRegion", "channelType"].filter(
      (f) => !mappedHeaders.includes(f),
    );
    if (missingRequired.length > 0) {
      setError(
        `Missing required columns: ${missingRequired.join(", ")}. ` +
        `Expected columns with headers like: Company Name, City / Region, Channel / Type`,
      );
      return;
    }

    const distributors = rows.map((row) => {
      const obj: Record<string, string> = {};
      const attributes: Record<string, string> = {};
      mappedHeaders.forEach((field, i) => {
        if (field && row[i] !== undefined) {
          const val = row[i].trim();
          if (field.startsWith("attributes.")) {
            const attrKey = field.slice("attributes.".length);
            attributes[attrKey] = val;
          } else {
            obj[field] = val;
          }
        }
      });
      if (Object.keys(attributes).length > 0) {
        (obj as any).attributes = attributes;
      }
      return obj;
    });

    // Filter out completely empty rows
    const valid = distributors.filter((d) => d.companyName || d.cityRegion || d.channelType);

    if (valid.length === 0) {
      setError("No valid data rows found after parsing.");
      return;
    }

    setImporting(true);
    try {
      const res = await importDistributors(valid as any);
      setResult(res);
      setRaw("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h3 className="mb-2 text-sm font-bold text-dark-blue">Import Distributors from CSV</h3>
      <p className="mb-3 text-xs text-gray-500">
        Paste your CSV data below. The first row must be headers. Required columns:{" "}
        <strong>Company Name</strong>, <strong>City / Region</strong>, <strong>Channel / Type</strong>.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={6}
        placeholder={
          'Company Name,City / Region,Channel / Type,Size / Scale,Website,Phone,Email,Contact Person,Do we know them?,Status / Last Contact,Description\n' +
          'ABC Trading,Riyadh,Modern Trade,Large,www.abc.com,+966 123 4567,info@abc.com,John Doe,Yes met at Gulfood,Active,Handles FMCG across KSA'
        }
        className="w-full rounded border border-border px-3 py-2 text-xs font-mono outline-none focus:border-mid-blue"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {result && (
        <p className="mt-2 text-xs text-green-700">
          Successfully imported {result.imported} distributor{result.imported !== 1 ? "s" : ""}.
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={parseAndImport}
          disabled={importing || !raw.trim()}
          className="rounded bg-mid-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-dark-blue disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          onClick={onDone}
          className="text-xs text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Parse a CSV line, respecting quoted values. */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}