import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The project's current release, read from the manifest next to site/ so it is never
 * maintained twice. npm projects keep it in package.json, Rust projects in Cargo.toml
 * (also as `[workspace.package]`, which a crate inherits with `version.workspace = true`).
 *
 * A wrong number on the page is worse than none: anything this cannot read with certainty
 * yields '', and the project passes `version` itself.
 */
export function projectVersion(repoRoot: string): string {
  return fromPackageJson(repoRoot) || fromCargoToml(repoRoot) || '';
}

function read(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function fromPackageJson(repoRoot: string): string {
  const raw = read(join(repoRoot, 'package.json'));
  if (raw === null) return '';
  try {
    const { version } = JSON.parse(raw) as { version?: unknown };
    return typeof version === 'string' ? version : '';
  } catch {
    return '';
  }
}

function fromCargoToml(repoRoot: string): string {
  const raw = read(join(repoRoot, 'Cargo.toml'));
  if (raw === null) return '';
  return section(raw, 'package') || section(raw, 'workspace.package');
}

/** First `version = "…"` inside [<name>], stopping at the next table header. */
function section(toml: string, name: string): string {
  const start = toml.search(new RegExp(`^\\[${name.replaceAll('.', '\\.')}\\]\\s*$`, 'm'));
  if (start === -1) return '';
  const rest = toml.slice(start);
  const next = rest.indexOf('\n[', 1);
  const body = next === -1 ? rest : rest.slice(0, next);
  const match = body.match(/^version\s*=\s*"([^"]+)"/m);
  return match ? match[1] : '';
}
