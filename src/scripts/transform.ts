import properCase from "proper-case";
import * as moment from "moment";

export function properName(record, ref) {
  const val = record.get(ref);
  if (typeof val === "string") {
    record.set(ref, properCase(val));
  } else {
    record.addError(ref, "Invalid " + ref);
  }
}

export function email(record, ref) {
  const val = record.get(ref);
  if (typeof val === "string") {
    record.set(ref, val.toLowerCase());
  } else {
    record.addError(ref, "Invalid email address (not a string)");
  }
}

export function date(record, ref) {
  const val = record.get(ref);
  const formats = ["MM/DD/YYYY", "MM-DD-YYYY", "YYYY-MM-DD"];
  const date = moment(val, formats, false);

  if (!date.isValid()) {
    record.addError(ref, "Date is not a valid format.");
  } else {
    record.set(ref, date.format("YYYY-MM-DD"));
  }
}
