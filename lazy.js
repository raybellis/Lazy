const SI = Symbol.iterator;

class InfiniteSequenceError extends Error { };

/*
 * Wraps a generator with a Lazy sequence object that allows
 * standard list processing functions to be chained together
 *
 * The supplied function must either be a native generator,
 * or a (void) function that returns an Iterable.
 *
 * The Lazy sequence object is itself iterable.
 */

class Lazy {

	constructor(iterator, infinite = false) {
		if (typeof iterator !== 'function') {
			throw new TypeError();
		}

		Object.defineProperty(this, SI, { value: iterator });
		Object.defineProperty(this, 'infinite', { value: infinite });
	}

	/*
	 * Returns the length of the sequence, if possible
	 *
	 * NB: this function is of O(n) complexity, not O(1)
	 *
	 */
	get length() {
		if (this.infinite) {
			return Infinity;
		} else {
			let n = 0;
			for (let k of this) {
				n++;
			}
			return n;
		}
	}

	get head() {
		let [ head ] = this.take(1);
		return head;
	}

	get tail() {
		return this.drop(1);
	}

	forEach(cb, ctx) {
		if (this.infinite) {
			throw new InfiniteSequenceError();
		}
		for (let k of this) {
			cb.call(ctx, k);
		}
	}

	map(cb, ctx) {
		if (typeof cb !== 'function') {
			throw new TypeError();
		}
		var orig = this;
		return new Lazy(function*() {
			for (let k of orig) {
				yield cb.call(ctx, k);
			}
		}, orig.infinite);
	}

	filter(pred, ctx) {
		if (typeof pred !== 'function') {
			throw new TypeError();
		}
		var orig = this;
		return new Lazy(function*() {
			for (let k of orig) {
				if (pred.call(ctx, k)) {
					yield k;
				}
			}
		}, orig.infinite);
	}

	reduce(f) {
		// TODO: support initial parameter
		if (typeof f !== 'function') {
			throw new TypeError();
		}

		if (this.infinite) {
			throw new InfiniteSequenceError();
		}

		let prev = this.head;
		let tail = this.tail;
		for (let current of tail) {
			prev = f(prev, current);
		}
		return prev;
	}

	take(n) {
		// TODO: parameter check
		var orig = this;
		return new Lazy(function*() {
			var i = 0;
			for (let k of orig) {
				if (i++ < n) {
					yield k;
				} else {
					return;
				}
			}
		}, false);
	}
	drop(n) {
		// TODO: parameter check
		var orig = this;
		return new Lazy(function*() {
			var i = 0;
			for (let k of orig) {
				if (i++ < n) {
					continue;
				} else {
					yield k;
				}
			}
		}, orig.infinite);
	}

	takeWhile(pred) {
		if (typeof pred !== 'function') {
			throw new TypeError();
		}
		var orig = this;
		return new Lazy(function*() {
			var take = true;
			for (let k of orig) {
				take = take && pred(k);
				if (take) {
					yield k;
				} else {
					return;
				}
			}
		}, false);		// NB: not correct if `pred` never returns `false`
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
		var orig = this;
		return new Lazy(function*() {
			var drop = true;
			for (let k of orig) {
				drop = drop && pred(k);
				if (drop) {
					continue;
				} else {
					yield k;
				}
			}
		}, orig.infinite);
	}

	static from(f, infinite = false) {
		if (typeof f !== 'function') {
			throw new TypeError('.from requires a function parameter');
		}
		return new Lazy(function*() {
			yield* f();
		}, infinite);
	}

	static cons(a, b, infinite) {
		var infinite;
		if (b[SI] === undefined) {
			throw new TypeError('.cons requires an iterable second parameter');
		}
		if (infinite == undefined && b instanceof Lazy) {
			infinite = b.infinite;
		}
		return new Lazy(function*() {
			yield a;
			yield* b;
		}, infinite) ;
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
		}, true);
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
		}, a.infinite && b.infinite);
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
