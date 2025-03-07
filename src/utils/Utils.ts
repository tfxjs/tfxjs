export default class Utils {
    /**
     * Get duplicated values from an array
     * @param values Values array
     * @returns Duplicated values
     */
    static GetDuplicatedValues(values: string[]): string[] {
        return values.filter((item, index) => values.indexOf(item) != index);
    }
}
