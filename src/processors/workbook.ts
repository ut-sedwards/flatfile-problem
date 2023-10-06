import * as transform from "../../scripts/transform";
import * as validate from "../../scripts/validate";

export function processMembers(record) {
  transform.properName(record, "firstName");

  transform.properName(record, "lastName");

  transform.email(record, "email");
  validate.email(record, "email");

  return record;
}

export function processNotes(record) {
  validate.date(record, "date");
  transform.date(record, "date");

  return record;
}
