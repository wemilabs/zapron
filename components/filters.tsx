"use client";

import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CONTINENTS, COUNTRIES, countryName } from "@/lib/geo";

const CURRENT_YEAR = new Date().getFullYear();
const PRIMARY_TYPE_OPTIONS = [
  { value: "article", label: "Journal article" },
  { value: "review", label: "Review" },
  { value: "book", label: "Book" },
  { value: "dissertation", label: "Dissertation" },
];

const MORE_TYPE_OPTIONS = [
  { value: "preprint", label: "Preprint" },
  { value: "book-chapter", label: "Book chapter" },
  { value: "proceedings-article", label: "Proceedings article" },
  { value: "report", label: "Report" },
  { value: "dataset", label: "Dataset" },
];

const TYPE_OPTIONS = [...PRIMARY_TYPE_OPTIONS, ...MORE_TYPE_OPTIONS];

const SORT_OPTIONS = [
  { value: "relevance_score", label: "Relevance" },
  { value: "publication_date", label: "Publication date" },
  { value: "cited_by_count", label: "Citations" },
];

export function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  const yearMin = params.get("year_min");
  const yearMax = params.get("year_max");
  const types = params.getAll("type");
  const continents = params.getAll("continent");
  const countries = params.getAll("country");
  const oaOnly = params.get("oa_only") === "true";
  const sort = params.get("sort") ?? "relevance_score";
  const hasActiveFilters = Boolean(
    yearMin ||
      yearMax ||
      types.length > 0 ||
      continents.length > 0 ||
      countries.length > 0 ||
      oaOnly ||
      sort !== "relevance_score",
  );

  const yearValues: [number, number] = [
    yearMin ? Number(yearMin) : 1900,
    yearMax ? Number(yearMax) : CURRENT_YEAR,
  ];

  function navigate(next: URLSearchParams) {
    next.delete("cursor");
    next.delete("page");
    router.replace(`/search?${next.toString()}`);
  }

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    navigate(next);
  }

  function updateYears([min, max]: [number, number]) {
    const next = new URLSearchParams(params.toString());
    if (min === 1900) next.delete("year_min");
    else next.set("year_min", String(min));
    if (max === CURRENT_YEAR) next.delete("year_max");
    else next.set("year_max", String(max));
    navigate(next);
  }

  function updateTypes(type: string, checked: boolean) {
    const selected = new Set(types);
    if (checked) selected.add(type);
    else selected.delete(type);

    const next = new URLSearchParams(params.toString());
    next.delete("type");
    for (const option of TYPE_OPTIONS) {
      if (selected.has(option.value)) next.append("type", option.value);
    }
    navigate(next);
  }

  function clearTypes() {
    const next = new URLSearchParams(params.toString());
    next.delete("type");
    navigate(next);
  }

  function updateContinents(continent: string, checked: boolean) {
    const selected = new Set(continents);
    if (checked) selected.add(continent);
    else selected.delete(continent);

    const next = new URLSearchParams(params.toString());
    next.delete("continent");
    for (const c of CONTINENTS) {
      if (selected.has(c.value)) next.append("continent", c.value);
    }
    navigate(next);
  }

  function clearContinents() {
    const next = new URLSearchParams(params.toString());
    next.delete("continent");
    navigate(next);
  }

  function updateCountries(nextCountries: string[]) {
    const next = new URLSearchParams(params.toString());
    next.delete("country");
    for (const code of nextCountries) next.append("country", code);
    navigate(next);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    const query = params.get("q");
    if (query) next.set("q", query);
    router.replace(`/search?${next.toString()}`);
  }

  return (
    <aside className="flex w-full flex-col gap-6">
      <YearFilter
        key={`${yearValues[0]}-${yearValues[1]}`}
        initialValues={yearValues}
        onCommit={updateYears}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Publication type
          </h3>
          {types.length > 0 && (
            <button
              type="button"
              onClick={clearTypes}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {PRIMARY_TYPE_OPTIONS.map((option) => (
            <TypeCheckbox
              key={option.value}
              option={option}
              checked={types.includes(option.value)}
              onCheckedChange={updateTypes}
            />
          ))}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground marker:content-none hover:text-foreground">
            <span className="group-open:hidden">Show more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {MORE_TYPE_OPTIONS.map((option) => (
              <TypeCheckbox
                key={option.value}
                option={option}
                checked={types.includes(option.value)}
                onCheckedChange={updateTypes}
              />
            ))}
          </div>
        </details>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Region</h3>
          {continents.length > 0 && (
            <button
              type="button"
              onClick={clearContinents}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {CONTINENTS.map((continent) => (
            <TypeCheckbox
              key={continent.value}
              option={continent}
              checked={continents.includes(continent.value)}
              onCheckedChange={updateContinents}
            />
          ))}
        </div>
      </div>

      <CountryFilter selected={countries} onChange={updateCountries} />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">Sort by</h3>
        <Select value={sort} onValueChange={(val) => update("sort", val)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {SORT_OPTIONS.find((option) => option.value === sort)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label
        htmlFor="open-access-only"
        className="flex items-center gap-2 text-sm text-foreground"
      >
        <Checkbox
          id="open-access-only"
          checked={oaOnly}
          onCheckedChange={(checked) =>
            update("oa_only", checked ? "true" : null)
          }
        />
        Open access only
      </label>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!hasActiveFilters}
        onClick={resetFilters}
      >
        Reset filters
      </Button>
    </aside>
  );
}

interface YearFilterProps {
  initialValues: [number, number];
  onCommit: (values: [number, number]) => void;
}

function YearFilter({ initialValues, onCommit }: YearFilterProps) {
  const [values, setValues] = useState(initialValues);

  function toRange(value: number | readonly number[]): [number, number] {
    if (typeof value === "number") return [value, value];
    return [value[0] ?? 1900, value[1] ?? CURRENT_YEAR];
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">Publication year</h3>
      <Slider
        min={1900}
        max={CURRENT_YEAR}
        value={values}
        onValueChange={(value) => setValues(toRange(value))}
        onValueCommitted={(value) => onCommit(toRange(value))}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{values[0]}</span>
        <span>{values[1]}</span>
      </div>
    </div>
  );
}

interface TypeCheckboxProps {
  option: { value: string; label: string };
  checked: boolean;
  onCheckedChange: (type: string, checked: boolean) => void;
}

function TypeCheckbox({ option, checked, onCheckedChange }: TypeCheckboxProps) {
  const id = `filter-${option.value}`;

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm text-foreground"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(nextChecked) =>
          onCheckedChange(option.value, nextChecked)
        }
      />
      {option.label}
    </label>
  );
}

interface CountryFilterProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

function CountryFilter({ selected, onChange }: CountryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.includes(q),
    );
  }, [search]);

  function toggle(code: string) {
    const set = new Set(selected);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    onChange([...set]);
  }

  function remove(code: string) {
    onChange(selected.filter((c) => c !== code));
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">Country</h3>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2 truncate">
                <SearchIcon className="size-3.5 text-muted-foreground" />
                {selected.length > 0
                  ? `${selected.length} selected`
                  : "Search countries…"}
              </span>
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search countries…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 ? (
                <CommandEmpty>No countries found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filtered.map((country) => {
                    const isSelected = selected.includes(country.code);
                    return (
                      <CommandItem
                        key={country.code}
                        value={country.code}
                        onSelect={() => toggle(country.code)}
                        data-checked={isSelected}
                      >
                        <CheckIcon
                          className={isSelected ? "opacity-100" : "opacity-0"}
                        />
                        <span className="flex-1">{country.name}</span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {country.code}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => remove(code)}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground hover:bg-muted/70"
            >
              {countryName(code)}
              <XIcon className="size-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
