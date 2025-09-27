interface NamedItem {
    getName(): string;
    getIndex(): number | undefined;
    toObject(): any;
}

class Collection<T extends NamedItem, TRaw = any> {
    protected items: Record<string, T> = {};

    public constructor(items: Record<string, TRaw> = {}, private factory?: (raw: TRaw) => T) {
        Object.keys(items).forEach((key) => this.add(items[key]));
    }

    public add(item: TRaw | T): this {
        let instance: T;
        if (this.factory && typeof item === 'object' && item !== null && !('getName' in item)) {
            instance = this.factory(item as TRaw);
        } else {
            instance = item as T;
        }
        this.items[instance.getName()] = instance;
        return this;
    }

    public get(name: string): T | undefined { return this.items[name]; }

    public toObject(): Record<string, ReturnType<T['toObject']>> {
        const obj: Record<string, any> = {};
        Object.keys(this.items).forEach((key) => {
            const item = this.items[key];
            obj[key] = item.toObject();
        });
        return obj;
    }

    public toArray(): T[] {
        return Object.values(this.items).sort((a, b) =>
            (a.getIndex() ?? Infinity) - (b.getIndex() ?? Infinity)
        );
    }
}

export {
    Collection,
    type NamedItem
};