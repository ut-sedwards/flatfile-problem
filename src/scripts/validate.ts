import * as moment from "moment";

export function email(record, ref) {
  const validRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const val = record.get(ref);
  if (typeof val === "string") {
    if (!validRegex.test(val)) {
      record.addError(ref, "Invalid email address");
    }
  } else {
    record.addError(ref, "Invalid email address (not a string)");
  }
}

export function date(record, ref, min = null, max = null) {
  const val = record.get(ref);
  const formats = ["MM/DD/YYYY", "MM-DD-YYYY", "YYYY-MM-DD"];
  const date = moment(val, formats, false);

  if (!date.isValid()) {
    record.addError(ref, "Date is not a valid format.");
  }

  if (min !== null && date < moment(min, "MM/DD/YYYY")) {
    record.addError(ref, "Date must fall after " + min);
  }

  if (max !== null && date > moment(max, "MM/DD/YYYY")) {
    record.addError(ref, "Date must fall before " + max);
  }
}
