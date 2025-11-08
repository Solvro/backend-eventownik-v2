import string from "@adonisjs/core/helpers/string";
import { CamelCaseNamingStrategy } from "@adonisjs/lucid/orm";
import { LucidModel } from "@adonisjs/lucid/types/model";
import { ModelRelations } from "@adonisjs/lucid/types/relations";

export default class PrismaNamingStrategy implements CamelCaseNamingStrategy {
  tableName(model: LucidModel): string {
    return string.plural(model.name);
  }

  columnName(_: LucidModel, attributeName: string): string {
    return attributeName;
  }

  serializedName(_: LucidModel, attributeName: string): string {
    return attributeName;
  }

  relationLocalKey(
    relation: ModelRelations<LucidModel, LucidModel>["__opaque_type"],
    model: LucidModel,
    relatedModel: LucidModel,
  ): string {
    if (relation === "belongsTo") {
      return relatedModel.primaryKey;
    }

    return model.primaryKey;
  }

  relationForeignKey(
    relation: ModelRelations<LucidModel, LucidModel>["__opaque_type"],
    model: LucidModel,
    relatedModel: LucidModel,
  ): string {
    if (relation === "belongsTo") {
      return string.camelCase(
        `${relatedModel.name}_${relatedModel.primaryKey}`,
      );
    }

    return string.camelCase(`${model.name}_${model.primaryKey}`);
  }

  relationPivotTable(
    _: "manyToMany",
    model: LucidModel,
    relatedModel: LucidModel,
  ): string {
    return `${string.plural(model.name)}${string.plural(relatedModel.name)}`;
  }

  relationPivotForeignKey(_: "manyToMany", model: LucidModel): string {
    return string.camelCase(`${model.name}_${model.primaryKey}`);
  }

  paginationMetaKeys(): {
    total: string;
    perPage: string;
    currentPage: string;
    lastPage: string;
    firstPage: string;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string;
    previousPageUrl: string;
  } {
    return {
      total: "total",
      perPage: "perPage",
      currentPage: "currentPage",
      lastPage: "lastPage",
      firstPage: "firstPage",
      firstPageUrl: "firstPageUrl",
      lastPageUrl: "lastPageUrl",
      nextPageUrl: "nextPageUrl",
      previousPageUrl: "previousPageUrl",
    };
  }
}
