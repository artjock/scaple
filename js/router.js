Scaple.Router = Backbone.Router.extend({
    routes: {
        '': 'home'
    },

    initialize: function() {
        this.$root = $('#app');

        this.collection = new Scaple.collections.Playlists();
        this.collection.fetch();

        // add default playlist
        if (!this.collection.models.length) {
            this.collection.add( new Scaple.models.Playlist() );
            this.collection.at(0).save();
        }

        this.app = new Scaple.views.App({
            collection: this.collection
        });

        if ('localStorage' in window) {
            this.initLocalStorage();
        }

        this.initHistory();
    },

    home: function() {
        this.$root.empty();
        this.$root.append(this.app.render().$el);
    },

    initLocalStorage: function() {
        var that = this;
        $(window).on('storage', function(e){
            that.loadLocalStorage();
        });

        this.loadLocalStorage();
    },

    loadLocalStorage: function() {
        var that = this;
        // search for track ids in localStorage
        var tracks = localStorage.getItem('scaple-tr');
        if (tracks) {
            tracks = JSON.parse(tracks);
            // get tracks by id from SC
            SC.get('/tracks', {ids: tracks.join(',')}, function(tracks) {
                // TODO: find active model
                // add found tracks to model
                var activeModel = that.collection.models[0];
                var current = activeModel.get('tracks');
                tracks = current.concat(tracks);
                activeModel.set('tracks', tracks);
                activeModel.save();
                // clear found track localStorage
                localStorage.removeItem('scaple-tr');
            })
        }
    },

    /**
     * Init history of changes component
     */
    initHistory: function() {
        var that = this;

        Scaple.History.init({
            onpush: function() {
                return that.collection.toJSON();
            },
            onpop: function(state) {
                that.collection.reset(state);
            }
        });

        $(window).on('keydown', function(e) {
            // CTRL+Z
            if (e.which === 90 && (e.metaKey || e.ctrlKey)) {
                // check if we are not inside input
                if ( $(e.target).is(':input') ) {
                    return;
                }

                Scaple.History.pop();
            }
        })
    }
});
