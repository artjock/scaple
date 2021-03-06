Scaple.views.App = Backbone.View.extend({

    events: {
        'click .js-playlist-selector': 'playlistSelect',
        'click .js-playlist-add': 'playlistAdd',
        'click .js-playlist-form-toggle': 'playlistFormToggle',
        'click .js-bookmark-form-toggle': 'bookmarkFormToggle',
    },

    tagName: 'div',
    className: 'b-app',
    template: Scaple.T('b-app'),

    /**
     * Default playlist width
     * @type Number
     */
    plWidth: 321,

    initialize: function() {
        _.bindAll(this, 'render', 'playlistDraw');

        this.collection.bind('reset', this.render);
        this.collection.bind('add', this.playlistDraw);

    },

    render: function() {
        // collection for all playlists subviews
        this.views = [];
        this.currentView = 0;

        this.$el.html( this.renderHTML() );
        // container for all playlists
        this.$playlists = this.$el.find('.js-app-playlists');
        // dots for switching playlists
        this.$dots = this.$el.find('.js-playlist-selector');
        // create playlist view for each model in collection
        this.collection.each(this.playlistDraw);

        this.updateDots();

        this.initAutocomplete();

        return this;
    },

    /**
     * Combines template data and generates HTML
     */
    renderHTML: function() {
        // get playlists titles to draw dots
        var playlists = this.collection.pluck('title');

        return this.template({playlists: playlists, bookmark: Scaple.bookmarklet});
    },


    initAutocomplete: function() {
        var that = this;
        this.$search = this.$el.find('.js-track-search');

        // bind autocomplete for search input
        this.$search.autocomplete({
            oninput: $.proxy(this.ontracksearch, this),
            template: Scaple.T('b-autocomplete'),
            appendTo: this.$el.find('.js-track-form'),
            onselect: function(track) {
                that.views[that.currentView].trackAdd(track);
            }
        });

    },

    /**
     * Handles user input in search field
     * @see http://api.jqueryui.com/autocomplete/#option-source
     * and sends requests to SC
     * @see http://developers.soundcloud.com/docs#search
     * @param {Object} request
     * @param {Function} response
     */
    ontracksearch: function(request, response) {
        SC.get('/tracks', { q: request.q, limit: 8 }, function(tracks) {
            response( tracks );
        });
    },

    /**
     * Visualize selection on dots
     */
    updateDots: function() {
        var selectedClass = 'b-playlist-selector__item_selected';

        // do we need to render new dots
        if (this.collection.length != this.$dots.length) {
            // generate new dots
            // TODO: use partitials
            var $root = $('<div/>').html( this.renderHTML() );

            this.$el
                .find('.js-playlist-selector-root')
                .replaceWith( $root.find('.js-playlist-selector-root') );

            // save new dots
            this.$dots = this.$el.find('.js-playlist-selector');
        }

        // update dots
        this.$dots.removeClass(selectedClass);
        this.$dots.eq(this.currentView).addClass(selectedClass);
    },

    /**
     * Creates view for playlist's model
     * and appends it to the DOM
     * @param {Backbone.Model} playlist
     */
    playlistDraw: function(playlist) {
        var $container = this.$el.find('.b-app__playlists');
        var view = new Scaple.views.Playlist({model: playlist, app: this});

        // save view to a collection
        this.views.push(view);

        // append view to dom
        $container.append( view.render().$el );

        // TODO: update dots
    },

    /**
     * Creates new model for playlist from form
     * and adds it to the collection
     */
    playlistAdd: function() {

        var playlist = new Scaple.models.Playlist();

        // save state before playlist adding
        Scaple.History.push();

        this.collection.add(playlist);

        playlist.save();

        // switch to new playlist
        this.playlistSelect(this.collection.length - 1);
    },

    /**
     * Handles playlist remove
     */
    playlistRemove: function() {
        // save state before playlist removing
        Scaple.History.push();
        // remove current playlist
        this.collection.at(this.currentView).destroy();
        // remove from views cache
        this.views.splice(this.currentView, 1);
        // always must be at leas one playlist
        if (!this.collection.length) {
            this.playlistAdd();
        } else {
            // go to first one after removeing
            this.playlistSelect(0);
        }
    },

    /**
     * Finds which playlist need to show
     * @param {Event|Number} e
     */
    playlistSelect: function(e) {
        var index = typeof e == 'number' ? e : $.inArray(e.currentTarget, this.$dots.get());

        // slide playlists
        this.$playlists.css('margin-left', (-index * this.plWidth) + 'px');

        // update current playlist index
        this.currentView = index;

        this.updateDots();
    },

    playlistFormToggle: function(e) {
        this.views[this.currentView].toggleForm(e);
    },

    bookmarkFormToggle: function(e) {
        this.$el.find('.js-bookmark-form').toggleClass('g-hidden');
    }
});

