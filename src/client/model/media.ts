/** A storage medium (HDD or DVD/ISO) attached to a VM. */
export interface MediaItem {
    type: string;
    path: string;
    size: string;
}

/**
 * A medium entry exposed to the application.
 *
 * Kept loose because the UI may want to display additional VBox fields.
 */
export interface MediumInfo {
    kind: "hdd" | "dvd";
    UUID?: string;
    Location?: string;
    Capacity?: string;
    Type?: string;
    [key: string]: string | undefined;
}
