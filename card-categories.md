Product Card Generation Instruction:
When generating HTML for a product card, you must populate the data-category attribute of the main wrapper element.
Selection Logic: Analyze the product name and description. Select the most specific slug from the "Category List" below that matches the item.
Formatting: The wrapper should look like this: <div class="product-card" data-category="SELECTED_SLUG_HERE">...</div>.
Fallback: If a product fits multiple categories, choose the most technical one, then add other slug related to it, use maximum 5 categories, If it fits none, use all.
Strict Constraint: Use ONLY the slugs provided. Do not invent new category names.
Category List:
{
  "root": [
    "all"
  ],
  "categories": [
    "bluetooth-speakers",
    "subwoofers",
    "amplifiers",
    "audio-modules",
    "audio-accessories",

    "lithium-batteries",
    "li-po-batteries",
    "18650-batteries",
    "battery-packs",
    "chargers",
    "power-supply",
    "charge-controllers",
    "bms-protection",

    "resistors",
    "capacitors",
    "transistors",
    "ic-chips",
    "sensors",
    "converter-modules",
    "inductors",
    "leds",
    "fuses",
    "relays",
    "switches",

    "arduino",
    "raspberry-pi",
    "development-boards",
    "breadboards",
    "jumper-wires",
    "diy-kits",

    "soldering-tools",
    "multimeters",
    "power-supply",
    "wire-strippers",
    "repair-tools",

    "oled-displays",
    "lcd-displays",
    "tft-displays",
    "e-ink-displays",
    "7-segment",
    "led-matrix",
    "touchscreens",

    "usb-connectors",
    "dc-connectors",
    "xt-connectors",
    "pin-headers",
    "terminal-blocks",
    "flat-cables",
    "wire-cables",

    "dc-motors",
    "servo-motors",
    "stepper-motors",
    "bldc-motors",
    "linear-actuators",
    "motor-drivers",
    "esc",

    "2wd-chassis",
    "4wd-chassis",
    "mecanum-chassis",
    "robot-arms",
    "drone-frames",
    "aluminium-profiles",

    "rubber-wheels",
    "mecanum-wheels",
    "tank-tracks",
    "gears-pulleys",
    "couplings-shafts",

    "rc-transmitters",
    "rc-receivers",
    "rc-controllers",

    "esp32",
    "esp8266",
    "stm32",
    "attiny",
    "pico",

    "wifi-modules",
    "bluetooth-modules",
    "nrf24",
    "lora-modules",
    "gsm-modules",
    "rf-modules",
    "zigbee-modules",

    "temperature-humidity",
    "motion-sensors",
    "gas-sensors",
    "ultrasonic-sensors",
    "light-sensors",
    "pressure-sensors",
    "imu-sensors",
    "gps-modules",

    "uart-modules",
    "i2c-modules",
    "spi-modules",
    "can-bus",
    "rs485-rs232",

    "drone-motors",
    "drone-esc",
    "flight-controllers",
    "propellers",
    "fpv-cameras",
    "vtx",
    "drone-batteries",
    "drone-accessories",

    "pla-filament",
    "abs-filament",
    "tpu-filament",
    "printer-parts",
    "hotend-nozzle",
    "print-beds",

    "led-strips",
    "addressable-leds",
    "led-drivers",
    "rgb-leds",
    "ir-leds",
    "laser-modules",

    "pcb-boards",
    "perfboards",
    "smd-components",
    "solder-paste",
    "pcb-standoffs",
    "heat-shrink",

    "solar-panels",
    "solar-charge-controllers",
    "solar-inverters",
    "wind-turbines",
    "energy-monitors"
  ]
}