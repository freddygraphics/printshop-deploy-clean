// ------------------------------------------------------
// OPTION ENGINE
// Core del sistema de opciones
// ------------------------------------------------------

export class OptionEngine {
  constructor(optionGroups = []) {
    this.groups = optionGroups;
  }

  // ----------------------------------------
  // Todos los grupos
  // ----------------------------------------

  getGroups() {
    return this.groups;
  }

  // ----------------------------------------
  // Buscar grupo por key
  // ----------------------------------------

  getGroup(key) {
    return this.groups.find((g) => g.key === key);
  }

  // ----------------------------------------
  // Buscar opción seleccionada
  // ----------------------------------------

  getSelectedOption(groupKey, values = {}) {
    const group = this.getGroup(groupKey);

    if (!group) return null;

    return group.values.find((v) => v.key === values[groupKey]);
  }

  // ----------------------------------------
  // Valor por defecto
  // ----------------------------------------

  getDefaultValues() {
    const defaults = {};

    this.groups.forEach((group) => {
      const option = group.values.find((v) => v.default);

      if (option) {
        defaults[group.key] = option.key;
      }
    });

    return defaults;
  }

  // ----------------------------------------
  // Visibilidad
  // ----------------------------------------

  isVisible(group, values = {}) {
    console.log({
      group: group.name,
      key: group.key,
      visibleWhen: group.visibleWhen,
      visibleValue: group.visibleValue,
      currentValue: values[group.visibleWhen],
    });

    if (!group.visibleWhen) return true;

    return values[group.visibleWhen] === group.visibleValue;
  }

  // ----------------------------------------
  // Grupos visibles
  // ----------------------------------------

  getVisibleGroups(values = {}) {
    return this.groups.filter((group) => this.isVisible(group, values));
  }

  // ----------------------------------------
  // Precio adicional
  // ----------------------------------------

  calculateOptionPrice(values = {}, quantity = 1) {
    let total = 0;

    const visibleGroups = this.getVisibleGroups(values);

    visibleGroups.forEach((group) => {
      const option = this.getSelectedOption(group.key, values);

      if (!option) return;

      switch (option.priceType) {
        case "fixed":
          total += Number(option.price || 0);
          break;

        case "perQty":
          total += Number(option.price || 0) * quantity;
          break;

        case "percent":
          // Lo implementaremos después
          break;

        default:
          total += Number(option.price || 0);
      }
    });

    return total;
  }
}
