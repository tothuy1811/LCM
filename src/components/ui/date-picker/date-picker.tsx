"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CalendarIcon } from "lucide-react";

export type DatePickerProps = {
  id?: string;
  label?: string;
  timeLabel?: string;
  initialDate?: Date;
  initialTime?: string;
  placeholder?: string;
  className?: string;
  dateFieldClassName?: string;
  timeFieldClassName?: string;
  showTime?: boolean;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  closeOnSelect?: boolean;
  timeStep?: number;
  onChange?: (date: Date | undefined) => void;
  onTimeChange?: (time: string) => void;
};

function formatDate(date: Date | undefined) {
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) return false;
  return !Number.isNaN(date.getTime());
}

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function DatePicker({
  id = "date-picker",
  label = "Date",
  timeLabel = "Time",
  initialDate,
  initialTime = "10:30:00",
  placeholder = "Select date",
  className,
  dateFieldClassName,
  timeFieldClassName,
  showTime = false,
  captionLayout = "dropdown",
  closeOnSelect = true,
  timeStep = 1,
  onChange,
  onTimeChange,
}: DatePickerProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(initialDate);
  const [month, setMonth] = React.useState<Date>(initialDate ?? new Date());
  const [value, setValue] = React.useState(formatDate(initialDate));
  const [timeValue, setTimeValue] = React.useState(initialTime);

  const calendarId = `${id}-calendar`;
  const timeId = `${id}-time`;

  React.useEffect(() => {
    setDate(initialDate);
    setMonth(initialDate ?? new Date());
    setValue(formatDate(initialDate));
  }, [initialDate]);

  React.useEffect(() => {
    setTimeValue(initialTime);
  }, [initialTime]);

  React.useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <FieldGroup
      className={joinClassNames(
        showTime ? "mx-auto max-w-md flex-row" : "mx-auto max-w-md",
        className
      )}
    >
      <Field className={joinClassNames("min-w-0 flex-1", dateFieldClassName)}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>

        <div ref={rootRef} className="relative">
          <InputGroup>
            <InputGroupInput
              id={id}
              value={value}
              placeholder={placeholder}
              onFocus={() => setOpen(true)}
              onChange={e => {
                const inputValue = e.target.value;
                setValue(inputValue);

                if (!inputValue.trim()) {
                  setDate(undefined);
                  onChange?.(undefined);
                  return;
                }

                const parsedDate = new Date(inputValue);
                if (isValidDate(parsedDate)) {
                  setDate(parsedDate);
                  setMonth(parsedDate);
                  onChange?.(parsedDate);
                }
              }}
              onKeyDown={e => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />

            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
                aria-expanded={open}
                aria-controls={calendarId}
                onClick={() => setOpen(prev => !prev)}
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {open ? (
            <div
              id={calendarId}
              className="absolute left-0 z-50 mt-2 w-auto overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-md"
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                captionLayout={captionLayout}
                onMonthChange={setMonth}
                onSelect={nextDate => {
                  setDate(nextDate);
                  setValue(formatDate(nextDate));
                  onChange?.(nextDate);

                  if (nextDate) {
                    setMonth(nextDate);
                    if (closeOnSelect) {
                      setOpen(false);
                    }
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </Field>

      {showTime ? (
        <Field className={joinClassNames("w-32 shrink-0", timeFieldClassName)}>
          <FieldLabel htmlFor={timeId}>{timeLabel}</FieldLabel>
          <Input
            type="time"
            id={timeId}
            step={timeStep}
            value={timeValue}
            onChange={e => {
              setTimeValue(e.target.value);
              onTimeChange?.(e.target.value);
            }}
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </Field>
      ) : null}
    </FieldGroup>
  );
}
