/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../Scripts/extensions.ts" />

import pagedResultSet = require("common/pagedResultSet");

class pagedList { 
	isFetching = ko.observable(false);
	items = ko.observableArray<any>();
	hasMoreItems = true;

	constructor(private fetcher: (skip: number, take: number) => JQueryPromise<pagedResultSet>, private take = 30) {
	}

	loadNextChunk(): JQueryPromise<any> {
		if (!this.isFetching()) {
			this.isFetching(true);
			return this.fetcher(this.items().length, this.take)
				.always(() => this.isFetching(false))
				.done(resultSet => {
					this.items.pushAll(resultSet.items);
					this.hasMoreItems = this.items().length < resultSet.totalResultCount;
				});
		}

		return null;
	}
}

export = pagedList;