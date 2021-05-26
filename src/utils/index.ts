export function addZero(department: number): string {
    const shouldRemoveZero = department < 10 && !String(department).includes('0');

    if (shouldRemoveZero) {
        return `0${department}`;
    }

    return String(department);
}
