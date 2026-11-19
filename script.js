"use strict";

const currentEl = document.getElementById("current");
const historyEl = document.getElementById("history");

const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const MAX_DIGITS = 15;

const state = {
  current: "0",       // number being typed (string)
  previous: null,     // stored left operand (number)
  operator: null,     // "+", "-", "*", "/"
  overwrite: false,   // next digit replaces current (after = or error)
};

function compute(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function format(n) {
  if (!Number.isFinite(n)) return "Error";
  // Avoid floating point noise such as 0.1 + 0.2 = 0.30000000000000004
  return String(parseFloat(n.toPrecision(12)));
}

function render() {
  currentEl.textContent = state.current;
  historyEl.textContent =
    state.previous !== null && state.operator
      ? `${format(state.previous)} ${SYMBOLS[state.operator]}`
      : "";
}

function resetAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = false;
}

function inputDigit(d) {
  if (state.current === "Error") resetAll();
  if (state.overwrite) {
    state.current = d;
    state.overwrite = false;
  } else if (state.current === "0") {
    state.current = d;
  } else if (state.current.replace(/[-.]/g, "").length < MAX_DIGITS) {
    state.current += d;
  }
}

function inputDecimal() {
  if (state.current === "Error") resetAll();
  if (state.overwrite) {
    state.current = "0.";
    state.overwrite = false;
  } else if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function chooseOperator(op) {
  if (state.current === "Error") return;
  if (state.operator && !state.overwrite) {
    // chain: 2 + 3 + ...  -> compute 2 + 3 first
    const result = compute(state.previous, state.operator, parseFloat(state.current));
    state.previous = result;
    state.current = format(result);
    if (state.current === "Error") {
      state.previous = null;
      state.operator = null;
      state.overwrite = true;
      return;
    }
  } else if (!state.operator) {
    state.previous = parseFloat(state.current);
  }
  state.operator = op;
  state.overwrite = true;
}

function equals() {
  if (state.current === "Error" || !state.operator || state.previous === null) return;
  const result = compute(state.previous, state.operator, parseFloat(state.current));
  state.current = format(result);
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
}

function backspace() {
  if (state.overwrite || state.current === "Error") return;
  state.current = state.current.length > 1 && !(state.current.length === 2 && state.current[0] === "-")
    ? state.current.slice(0, -1)
    : "0";
}

function percent() {
  if (state.current === "Error") return;
  state.current = format(parseFloat(state.current) / 100);
  state.overwrite = true;
}

function negate() {
  if (state.current === "Error" || state.current === "0") return;
  state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
}

function handle(action, value) {
  switch (action) {
    case "digit": inputDigit(value); break;
    case "decimal": inputDecimal(); break;
    case "operator": chooseOperator(value); break;
    case "equals": equals(); break;
    case "clear": resetAll(); break;
    case "backspace": backspace(); break;
    case "percent": percent(); break;
    case "negate": negate(); break;
  }
  render();
}

document.querySelector(".keys").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  handle(btn.dataset.action, btn.dataset.value);
});

document.addEventListener("keydown", (e) => {
  const k = e.key;
  if (/^[0-9]$/.test(k)) handle("digit", k);
  else if (k === ".") handle("decimal");
  else if (["+", "-", "*", "/"].includes(k)) { e.preventDefault(); handle("operator", k); }
  else if (k === "Enter" || k === "=") { e.preventDefault(); handle("equals"); }
  else if (k === "Backspace") handle("backspace");
  else if (k === "Escape" || k === "Delete") handle("clear");
  else if (k === "%") handle("percent");
});

render();
