var chai = require('chai');
var httpMocks = require('node-mocks-http');
var expect = chai.expect;

var mongoose = require('mongoose');
// var mockgoose = require('mockgoose');
// mockgoose(mongoose);

var Ref = require('../lib/accessors/ref');
var Response = require('../lib/response');
var Resource = require('../lib/resource');
var Property = require('../lib/accessors/property');

describe('Ref', function() {
	var testModel, response;
	before(function(done) {
		mongoose.connect('mongodb://localhost/test', function(err) {
			if (err) return done(err)
			testModel = require('./testModel');
			done();
		});
	});
	
	beforeEach(function(done) {
		// mockgoose.reset();
		mongoose.connection.db.dropDatabase(done);
		var res = httpMocks.createResponse();
		response = new Response(res);
	});
	
	after(function(done) {
		mongoose.disconnect(done);
	});
	
	describe('#serialize', function() {
		var resource, response;
		beforeEach(function() {
			resource = new Resource(testModel, {
				id: new Property('_id'),
				type: 'test-models',
			});
			var res = httpMocks.createResponse();
			response = new Response(res);
		});
		
		it('sets resource field from document', function(done) {
			var ref = new Ref(resource, '_id');
			var object = new testModel;
			object.save(function(err) {
				if (err) return done(err);
				ref.serialize(object, response, function(err, resdata) {
					if (err) return done(err);
					expect(resdata).to.have.property('data');
					expect(resdata.data).to.have.property('id');
					expect(resdata.data).to.have.property('type', 'test-models');
					expect(resdata.data.id).to.satisfy(function(id) {
						return id.equals(object._id);
					});
					var include = response.include('test-models', object._id);
					expect(include).to.have.property('id');
					expect(include).to.have.property('type', 'test-models');
					expect(include.id).to.satisfy(function(id) {
						return id.equals(object._id);
					});
					done();
				});
			});
		});
		
		it('sets meta object in response', function(done) {
			var ref = new Ref(resource, '_id', { meta: { name: 'value' }});
			var object = new testModel;
			object.save(function(err) {
				if (err) return done(err);
				ref.serialize(object, response, function(err, resdata) {
					if (err) return done(err);
					expect(resdata).to.have.deep.property('meta.name', 'value');
					done();
				});
			});
		});
		
		it('sets links object in response', function(done) {
			var ref = new Ref(resource, '_id', { links: { name: 'value' }});
			var object = new testModel;
			object.save(function(err) {
				if (err) return done(err);
				ref.serialize(object, response, function(err, resdata) {
					if (err) return done(err);
					expect(resdata).to.have.deep.property('links.name', 'value');
					done();
				});
			});
		});
	});
	
	describe('#deserialize', function() {
		var linked, output;
		before(function() {
			output = {};
			linked = new testModel;
		});
		
		it('sets document property from resource field', function(done) {
			var resource = new Resource(testModel, {
				id: new Property('_id'),
				type: 'test-models',
			});
			var resdata = {
				data: {
					id: linked._id,
					type: 'test-models',
				},
			};
			var ref = new Ref(resource, '_id');
			ref.deserialize(resdata, null, output, function(err) {
				if (err) return done(err);
				expect(output).to.have.property('_id');
				expect(output._id).to.satisfy(function(id) {
					return id.equals(linked._id);
				});
				done();
			});
		});
	});
});
