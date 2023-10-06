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
  const validRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const val = record.get(ref);
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    if (!validRegex.test(lower)) {
      record.addError(ref, "Invalid email address");
    } else {
      record.set(ref, lower);
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
  } else if (min !== null && date < moment(min, "MM/DD/YYYY")) {
    record.addError(ref, "Date must fall after " + min);
  } else if (max !== null && date > moment(max, "MM/DD/YYYY")) {
    record.addError(ref, "Date must fall before " + max);
  } else {
    record.set(ref, date.format("YYYY-MM-DD"));
  }
}

export function ssn(record, ref) {
  console.log("Parse SSN");
  const val = record.get(ref);
  const validRegex =
    // eslint-disable-next-line no-useless-escape
    /^((?!666|000)[0-8][0-9\_]{2}\-(?!00)[0-9\_]{2}\-(?!0000)[0-9\_]{4})*$/;

  if (typeof val === "string" && val.length > 0) {
    const stripped = val.replace(/\D/g, "");

    if (stripped.length == 9) {
      const seg1 = stripped.slice(0, 3);
      const seg2 = stripped.slice(3, 5);
      const seg3 = stripped.slice(5, 9);

      const formatted = `${seg1}-${seg2}-${seg3}`;

      if (!validRegex.test(formatted)) {
        record.addError(ref, "Invalid SSN, does not match requirements.");
      } else {
        record.set(ref, formatted);
      }
    } else {
      record.addError(ref, "Invalid SSN, must be 9 digits.");
    }
  }
}

export function phone(record, ref) {
  console.log("Parse Phone");
  const val = record.get(ref);

  if (typeof val === "string" && val.length > 0) {
    let stripped = val.replace(/\D/g, "");

    //CHECK THAT NUMBER IS 10 DIGITS OR 11 WITH THE FIRST DIGIT BEING A 1
    if (
      stripped.length == 10 ||
      (stripped.length == 11 && stripped.slice(0, 1) == "1")
    ) {
      if (stripped.slice(0, 1) == "1") {
        stripped = stripped.slice(1);
      }

      const seg1 = stripped.slice(0, 3);
      const seg2 = stripped.slice(3, 6);
      const seg3 = stripped.slice(6, 10);

      // National format without country code--can be appended later from DB or a lookup
      const formatted = `(${seg1}) ${seg2}-${seg3}`;

      if (formatted.length != 14) {
        record.addError(ref, "Invalid Phone, does not match requirements.");
      } else {
        record.set(ref, formatted);
      }
    } else {
      record.addError(ref, "Invalid Phone, must be 10 or 11 digits.");
    }
  }
}
