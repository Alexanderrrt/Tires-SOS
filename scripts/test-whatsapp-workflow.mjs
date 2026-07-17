import assert from "node:assert/strict";
import {
  assistantAskedForName,
  detectWhatsAppHandoff,
  detectWhatsAppLanguage,
  detectWhatsAppService,
  hasWhatsAppAppointmentIntent,
  hasWhatsAppCancellationIntent,
  hasWhatsAppRescheduleIntent,
  isWhatsAppNameRefusal,
  isWhatsAppNonNameReply,
  nextWhatsAppBookingQuestion,
  whatsAppGreetingReply,
  whatsAppStaleSlotReply,
} from "../lib/whatsapp-workflow.js";

const user = (content) => ({ role: "user", content });
const assistant = (content) => ({ role: "assistant", content });

const services = [
  ["I need an oil change", "Oil change"],
  ["Tengo una llanta ponchada", "Flat repair"],
  ["The brakes are grinding", "Brakes"],
  ["Necesito una alineación", "Alignment"],
  ["My car won't start", "Diagnostic"],
  ["Sale humo del motor", "Diagnostic"],
  ["I smell something burning", "Diagnostic"],
  ["I need new tires", "Tires"],
  ["The battery is dead", "Battery"],
  ["Necesito revisar la suspensión", "Suspension"],
];
for (const [text, expected] of services) {
  assert.equal(detectWhatsAppService([user(text)]), expected, `service: ${text}`);
}

assert.equal(detectWhatsAppLanguage("Hello", []), "en");
assert.equal(detectWhatsAppLanguage("Hola", []), "es");
assert.equal(detectWhatsAppLanguage("3", [assistant("¿Qué servicio necesitas?"), user("3")]), "en");
assert.equal(detectWhatsAppLanguage("3", [user("Hola"), assistant("How can I help?")]), "es");
assert.equal(detectWhatsAppLanguage("Gracias", [user("Hello")]), "es");

assert.match(whatsAppGreetingReply("Hello", "en"), /^Hi!/);
assert.match(whatsAppGreetingReply("Hola", "es"), /^¡Hola!/);
assert.equal(whatsAppGreetingReply("I need tires", "en"), "");
assert.match(whatsAppStaleSlotReply("9", [], "en"), /active list/);
assert.equal(whatsAppStaleSlotReply("2", [{ date: "2026-07-18", time: "10:00" }], "en"), "");

assert.equal(hasWhatsAppAppointmentIntent([user("I'd like to schedule an appointment")]), true);
assert.equal(hasWhatsAppAppointmentIntent([user("How much are tires?")]), false);
assert.equal(hasWhatsAppRescheduleIntent("I need to reschedule my appointment"), true);
assert.equal(hasWhatsAppRescheduleIntent("Quiero cambiar mi cita"), true);
assert.equal(hasWhatsAppRescheduleIntent("Change my oil"), false);
assert.equal(hasWhatsAppCancellationIntent("Cancel my appointment"), true);
assert.equal(hasWhatsAppCancellationIntent("Elimina la reserva"), true);
assert.equal(hasWhatsAppCancellationIntent("Delete my message"), false);

assert.equal(assistantAskedForName("What is your name?"), true);
assert.equal(assistantAskedForName("¿Cuál es tu nombre?"), true);
assert.equal(assistantAskedForName("No necesitas saber el nombre del servicio."), false);
for (const text of ["Gracias", "Thank you", "Okay", "Perfecto"]) {
  assert.equal(isWhatsAppNonNameReply(text), true, `non-name reply: ${text}`);
}
for (const text of ["Prefiero no dar mi nombre", "No quiero compartir mi nombre", "I'd rather not give my name", "I prefer not to share my name"]) {
  assert.equal(isWhatsAppNameRefusal(text), true, `name refusal: ${text}`);
}
assert.equal(isWhatsAppNameRefusal("My name is Carlos"), false);

assert.match(nextWhatsAppBookingQuestion({ service: "Diagnostic" }, "es", "Sale humo del motor"), /no sigas conduciendo/);
assert.match(nextWhatsAppBookingQuestion({ service: "Diagnostic" }, "en", "Smoke is coming from the engine"), /don't keep driving/);
assert.match(nextWhatsAppBookingQuestion({ service: "Brakes" }, "en", "My brakes failed"), /Do not drive/);
assert.match(nextWhatsAppBookingQuestion({ service: "Flat repair" }, "es", "Tengo una llanta ponchada"), /no conduzcas/);
assert.match(nextWhatsAppBookingQuestion({ service: "Tires", vehicle: "Honda Civic 2018" }, "en", ""), /name/);
assert.match(nextWhatsAppBookingQuestion({ service: "Diagnostic", vehicle: "Toyota Corolla 2012" }, "es", "Prefiero no dar mi nombre"), /primer nombre/);

assert.equal(detectWhatsAppHandoff([user("Actually, I want to book again")]).shouldHandoff, false);
assert.equal(detectWhatsAppHandoff([user("Quiero reservar otra vez")]).shouldHandoff, false);
assert.equal(detectWhatsAppHandoff([user("I want a human representative")]).shouldHandoff, true);
assert.equal(detectWhatsAppHandoff([user("You keep asking the same question")]).shouldHandoff, true);
assert.equal(detectWhatsAppHandoff([user("¿Por qué preguntas otra vez?")]).shouldHandoff, true);
assert.equal(detectWhatsAppHandoff([user("Hello"), assistant("Hi"), user("Hello")]).shouldHandoff, true);

console.log("WhatsApp workflow regression suite passed (52 checks).");
