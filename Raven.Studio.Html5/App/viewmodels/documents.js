define(["require", "exports", "durandal/app", "plugins/router", "models/collection", "models/document", "viewmodels/deleteCollection", "common/raven", "common/pagedList"], function(require, exports, __app__, __router__, __collection__, __document__, __deleteCollection__, __raven__, __pagedList__) {
    
    var app = __app__;
    
    var router = __router__;

    var collection = __collection__;
    var document = __document__;
    var deleteCollection = __deleteCollection__;
    var raven = __raven__;
    var pagedList = __pagedList__;

    var documents = (function () {
        function documents() {
            var _this = this;
            this.displayName = "documents";
            this.collections = ko.observableArray();
            this.selectedCollection = ko.observable().subscribeTo("ActivateCollection").distinctUntilChanged();
            this.collectionColors = [];
            this.currentCollectionPagedItems = ko.observable();
            this.ravenDb = new raven();
            this.selectedCollection.subscribe(function (c) {
                return _this.onSelectedCollectionChanged(c);
            });
        }
        documents.prototype.collectionsLoaded = function (collections) {
            var _this = this;
            // Set the color class for each of the collections.
            // These styles are found in app.less.
            var collectionStyleCount = 15;
            collections.forEach(function (c, index) {
                return c.colorClass = "collection-style-" + (index % collectionStyleCount);
            });

            // Create the "All Documents" pseudo collection.
            this.allDocumentsCollection = new collection("All Documents", true);
            this.allDocumentsCollection.colorClass = "all-documents-collection";
            this.allDocumentsCollection.documentCount = ko.computed(function () {
                return _this.collections().filter(function (c) {
                    return c !== _this.allDocumentsCollection;
                }).map(function (c) {
                    return c.documentCount();
                }).reduce(function (first, second) {
                    return first + second;
                }, 0);
            });

            // All systems a-go. Load them into the UI and select the first one.
            var allCollections = [this.allDocumentsCollection].concat(collections);
            this.collections(allCollections);

            var collectionToSelect = collections.filter(function (c) {
                return c.name === _this.collectionToSelectName;
            })[0] || this.allDocumentsCollection;
            collectionToSelect.activate();

            // Fetch the collection info for each collection.
            // The collection info contains information such as total number of documents.
            collections.forEach(function (c) {
                return _this.fetchTotalDocuments(c);
            });
        };

        documents.prototype.fetchTotalDocuments = function (collection) {
            this.ravenDb.collectionInfo(collection.name).done(function (info) {
                collection.documentCount(info.totalResults);
            });
        };

        documents.prototype.onSelectedCollectionChanged = function (selected) {
            var _this = this;
            if (collection) {
                var fetcher = function (skip, take) {
                    var collectionName = selected !== _this.allDocumentsCollection ? selected.name : null;
                    return _this.ravenDb.documents(collectionName, skip, take);
                };

                var documentsList = new pagedList(fetcher, 30);
                this.currentCollectionPagedItems(documentsList);
            }
        };

        documents.prototype.activate = function (args) {
            var _this = this;
            var collectionsLoadedTask = this.ravenDb.collections().done(function (results) {
                return _this.collectionsLoaded(results);
            });

            // We can optionally pass in a collection name to view's URL, e.g. #/documents?collection=Foo/123
            this.collectionToSelectName = args ? args.collection : null;
            return collectionsLoadedTask;
        };

        documents.prototype.attached = function (view, parent) {
            // Initialize the context menu (using Bootstrap-ContextMenu library).
            // TypeScript doesn't know about Bootstrap-Context menu, so we cast jQuery as any.
            ($('.document-collections li')).contextmenu({
                target: '#collections-context-menu'
            });
        };

        documents.prototype.deleteCollection = function () {
            var _this = this;
            var collection = this.selectedCollection();
            if (collection) {
                var viewModel = new deleteCollection(collection);
                viewModel.deletionTask.done(function () {
                    _this.collections.remove(collection);
                    _this.allDocumentsCollection.activate();
                });
                app.showDialog(viewModel);
            }
        };

        documents.prototype.activateCollection = function (collection) {
            collection.activate();
            router.navigate("#documents?collection=" + collection.name, false);
        };
        return documents;
    })();

    
    return documents;
});
//# sourceMappingURL=documents.js.map