import * as transform from "../scripts/transform";

export function processMembers(record) {
  transform.properName(record, "firstName");

  transform.properName(record, "lastName");

  transform.email(record, "email");

  transform.ssn(record, "ssn");

  transform.phone(record, "phone");

  return record;
}

export function processNotes(record) {
  transform.date(record, "date");

  return record;
}
