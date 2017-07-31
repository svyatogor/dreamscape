function query(target, key, descriptor) {
  target.queries[key] = descriptor.value
}

function mutation(target, key, descriptor) {
  target.mutations[key] = descriptor.value
}

export {query, mutation}
