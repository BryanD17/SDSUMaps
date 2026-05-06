// Jest config for service-layer unit tests (A6).
// Plain ts-jest with node env: eventService.ts imports nothing RN-specific
// once `firebase/firestore` and `../utils/firebase` are mocked, so the heavy
// jest-expo preset isn't needed here.
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
};
