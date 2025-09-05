import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

type IstatRow = Record<string, string>;
type ExtraRow = {
  codice_istat: string;
  cap: string;
  lat: string;
  lon: string;
};

export async function mergeComuni() {
  const ISTAT_FILE = path.resolve(
    __dirname,
    "../resources/Elenco-comuni-italiani.csv"
  );
  const EXTRA_FILE = path.resolve(__dirname, "../resources/gi_comuni_cap.csv");
  const OUTPUT = path.resolve(__dirname, "../resources/comuni_unificati.csv");

  // Normalizza codici ISTAT (001001 -> 1001)
  function normalizeCode(code?: string | number) {
    if (!code) return "";
    return code.toString().trim().padStart(6, "0");
  }

  // 1. Carica file Elenco-comuni-italiani.csv
  const bufIstat = fs.readFileSync(ISTAT_FILE, "utf-8");
  const istatRows = parse(bufIstat, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ";",
    relax_quotes: true,
  }) as IstatRow[];

  // 2. Carica file gi_comuni_cap.csv
  const bufExtra = fs.readFileSync(EXTRA_FILE, "utf-8");
  const extraRows = parse(bufExtra, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ";",
    relax_quotes: true,
  }) as ExtraRow[];

  // 3. Mappa CAP per codice ISTAT
  const extraByCode = new Map<string, ExtraRow>();
  for (const row of extraRows) {
    const codice = normalizeCode(row.codice_istat);
    if (!codice) continue;
    extraByCode.set(codice, row);
  }

  // 4. Merge: mantieni colonne ISTAT + aggiungi cap, lat, lon
  const merged = istatRows.map((row) => {
    const codice = normalizeCode(row["Codice Comune formato numerico"]);
    const extra = extraByCode.get(codice);

    return {
      ...row,
      cap: extra ? extra.cap.trim() : "",
      lat: extra ? extra.lat.replace(",", ".") : "",
      lon: extra ? extra.lon.replace(",", ".") : "",
    };
  });

  // 5. Scrivi file CSV consolidato
  // Mantieni colonne ISTAT + aggiungi cap, lat, lon
  const originalColumns = Object.keys(istatRows[0]);
  const columns = [
    ...originalColumns,
    "Codice di avviamento postale",
    "Latitudine",
    "Longitudine",
  ];

  // Mappiamo i valori cap/lat/lon alle colonne estese
  const finalData = merged.map((row) => {
    return {
      ...row,
      "Codice di avviamento postale": row.cap,
      Latitudine: row.lat,
      Longitudine: row.lon,
    };
  });

  const csv = stringify(finalData, {
    header: true,
    columns,
    delimiter: ";",
  });

  fs.writeFileSync(OUTPUT, csv, "utf-8");

  console.log(`✅ Merge completato: ${merged.length} comuni in ${OUTPUT}`);
}

// Allow this file to be both imported as a module or run directly
if (require.main === module) {
  mergeComuni().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
