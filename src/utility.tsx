export function enumKeys<T>(enumObject: T): (keyof T)[] {
	// Note: there are two isNaNs in this world. 
	return Object.keys(enumObject).filter(k => isNaN(Number(k))) as (keyof T)[];
}