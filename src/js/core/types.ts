export interface BoundaryPoint {
    node: Node;
    offset: number;
}

export interface Bookmark {
    s: {
        path: number[];
        offset: number;
    };
    e: {
        path: number[];
        offset: number;
    };
}
