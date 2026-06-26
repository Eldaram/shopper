export function getCategoryDisplayName(opt) {
  const spaces = '\u00A0\u00A0\u00A0\u00A0';
  return spaces.repeat(opt.indent) + (opt.indent > 0 ? '└─ ' : '') + opt.name;
}

export function getCategoryTreeOptions(categories) {
  const roots = categories.filter((c) => c.parent_id === null);
  const options = [];

  const traverse = (category, level = 0) => {
    options.push({
      id: category.id,
      name: category.name,
      indent: level,
    });
    const children = categories.filter((c) => c.parent_id === category.id);
    for (const child of children) {
      traverse(child, level + 1);
    }
  };

  for (const root of roots) {
    traverse(root, 0);
  }

  const orphaned = categories.filter(
    (c) => c.parent_id !== null && !categories.some((p) => p.id === c.parent_id)
  );
  for (const orphan of orphaned) {
    options.push({
      id: orphan.id,
      name: orphan.name,
      indent: 0,
    });
  }

  return options;
}

export function getParentCategoryOptions(categories, currentCategoryId) {
  if (!currentCategoryId) {
    return getCategoryTreeOptions(categories);
  }

  const descendantIds = [];
  const findDescendants = (parentId) => {
    const children = categories.filter((c) => c.parent_id === parentId);
    for (const child of children) {
      descendantIds.push(child.id);
      findDescendants(child.id);
    }
  };
  findDescendants(currentCategoryId);

  const filteredCategories = categories.filter(
    (c) => c.id !== currentCategoryId && !descendantIds.includes(c.id)
  );
  return getCategoryTreeOptions(filteredCategories);
}
