// Generates a visual bar like: [██████░░░░] 60%
function createProgressBar(current, max, size = 10) {
    const percentage = Math.max(0, Math.min(1, current / max));
    const filledChars = Math.round(size * percentage);
    const emptyChars = size - filledChars;
    return `[${'█'.repeat(filledChars)}${'░'.repeat(emptyChars)}] ${Math.round(percentage * 100)}%`;
}