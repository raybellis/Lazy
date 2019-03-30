/*
 * Wraps a generator with a Lazy sequence object that allows
 * standard list processing functions to be chained together
 *
 * The supplied function must either be a native generator,
 * or a (void) function that returns an Iterable.
 *
 * The Lazy sequence object is itself iterable.
 */

const SI = Symbol.iterator;

class Lazy {

	constructor(iterator) {
		if (typeof iterator !== 'function') {
			throw new TypeError();
		}

		Object.defineProperty(this, SI, { value: iterator });
	}

	get head() {
		let [ head ] = this.take(1);
		return head;
	}

	get tail() {
		return this.drop(1);
	}

	forEach(cb, ctx) {
		let index = 0;
		for (let k of this) {
			cb.call(ctx, k, index++);
		}
        }

	map(cb, ctx) {
		if (typeof cb !== 'function') {
			throw new TypeError();
		}
		let orig = this;
		return new Lazy(function*() {
			let index = 0;
			for (let k of orig) {
				yield cb.call(ctx, k, index++);
			}
		});
	}

	filter(pred, ctx) {
		if (typeof pred !== 'function') {
			throw new TypeError();
		}
		let orig = this;
		return new Lazy(function*() {
			let index = 0;
			for (let k of orig) {
				if (pred.call(ctx, k, index++)) {
					yield k;
				}
			}
		});
	}

	reduce(f) {
		// TODO: support initial parameter
		if (typeof f !== 'function') {
			throw new TypeError();
		}

		let prev = this.head;
		let tail = this.tail;
		let index = 0;
		for (let current of tail) {
			prev = f(prev, current, index++);
		}
		return prev;
	}

	take(n) {
		// TODO: parameter check
		let orig = this;
		return new Lazy(function*() {
			let i = 0;
			for (let k of orig) {
				if (i++ < n) {
					yield k;
				} else {
					return;
				}
			}
		});
	}

	drop(n) {
		// TODO: parameter check
		let orig = this;
		return new Lazy(function*() {
			let index = 0;
			for (let k of orig) {
				if (index++ < n) {
					continue;
				} else {
					yield k;
				}
			}
		});
	}

	takeWhile(pred) {
		if (typeof pred !== 'function') {
			throw new TypeError();
		}
		let orig = this;
		return new Lazy(function*() {
			let take = true;
			for (let k of orig) {
				take = take && pred(k);
				if (take) {
					yield k;
				} else {
					return;
				}
			}
		});
	}

	/*
	 * returns a new Lazy sequence containing all of the
	 * elements of the original sequence following the
	 * first for which the supplied predicate returns `true`.
	 */
	dropWhile(pred) {
		if (typeof pred !== 'function') {
			throw new TypeError();
		}
		let orig = this;
		return new Lazy(function*() {
			let drop = true;
			for (let k of orig) {
				drop = drop && pred(k);
				if (drop) {
					continue;
				} else {
					yield k;
				}
			}
		});
	}

	static from(f) {
		if (typeof f !== 'function') {
			throw new TypeError('.from requires a function parameter');
		}
		return new Lazy(function*() {
			yield* f();
		});
	}

	static cons(a, b) {
		if (b[SI] === undefined) {
			throw new TypeError('.cons requires an iterable second parameter');
		}
		return new Lazy(function*() {
			yield a;
			yield* b;
		});
	}

	static naturals(n = 0) {

		if (typeof n === 'number') {
			if (n < 0) {
				throw new RangeError();
			}
		} else {
			throw new TypeError();
		}

		return new Lazy(function*() {
			let i = n;
			while (true) {
				yield i++;
			}
		});
	}

	static zip(a, b) {

		var sa = a[SI];
		var sb = b[SI];
		if (sa === undefined || sb === undefined) {
			throw new TypeError();
		}

		return new Lazy(function*() {
			var ia = sa();
			var ib = sb();
			while (true) {
				var na = ia.next();
				var nb = ib.next();
				if (na.done || nb.done) {
					return;
				}
				yield [ na.value, nb.value ];
			}
		});
	}

	static zipWith(f, a, b) {
		return Lazy.zip(a, b).map(([a, b]) => f(a, b));
	}

	static lazy() {
		var orig = this;
		return new Lazy(function*() {
			yield* orig;
		});
	}
}

module.exports = Lazy;
