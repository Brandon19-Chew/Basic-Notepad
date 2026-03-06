require 'sinatra'
require 'json'
require 'fileutils'

# Ruby Notepad App - Sinatra Backend
# Stores notes as JSON files on the server

set :port, 4567
set :bind, '0.0.0.0'
set :public_folder, File.join(File.dirname(__FILE__), 'public')

NOTES_DIR = File.join(File.dirname(__FILE__), 'notes')
FileUtils.mkdir_p(NOTES_DIR)

# Serve the main page
get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# API: Get all notes
get '/api/notes' do
  content_type :json
  notes = Dir.glob(File.join(NOTES_DIR, '*.json')).map do |file|
    JSON.parse(File.read(file))
  end
  notes.sort_by { |n| -(n['updated_at'] || 0) }.to_json
end

# API: Get a single note
get '/api/notes/:id' do
  content_type :json
  file = File.join(NOTES_DIR, "#{params[:id]}.json")
  if File.exist?(file)
    File.read(file)
  else
    status 404
    { error: 'Note not found' }.to_json
  end
end

# API: Create a new note
post '/api/notes' do
  content_type :json
  data = JSON.parse(request.body.read)
  id = Time.now.to_i.to_s + rand(1000).to_s
  note = {
    'id' => id,
    'title' => data['title'] || 'Untitled',
    'content' => data['content'] || '',
    'color' => data['color'] || '#ffffff',
    'created_at' => Time.now.to_i,
    'updated_at' => Time.now.to_i
  }
  File.write(File.join(NOTES_DIR, "#{id}.json"), note.to_json)
  status 201
  note.to_json
end

# API: Update a note
put '/api/notes/:id' do
  content_type :json
  file = File.join(NOTES_DIR, "#{params[:id]}.json")
  unless File.exist?(file)
    status 404
    return { error: 'Note not found' }.to_json
  end
  existing = JSON.parse(File.read(file))
  data = JSON.parse(request.body.read)
  existing['title'] = data['title'] if data['title']
  existing['content'] = data['content'] if data['content']
  existing['color'] = data['color'] if data['color']
  existing['updated_at'] = Time.now.to_i
  File.write(file, existing.to_json)
  existing.to_json
end

# API: Delete a note
delete '/api/notes/:id' do
  content_type :json
  file = File.join(NOTES_DIR, "#{params[:id]}.json")
  if File.exist?(file)
    File.delete(file)
    { success: true }.to_json
  else
    status 404
    { error: 'Note not found' }.to_json
  end
end

# API: Search notes
get '/api/search' do
  content_type :json
  query = (params[:q] || '').downcase
  notes = Dir.glob(File.join(NOTES_DIR, '*.json')).map do |file|
    JSON.parse(File.read(file))
  end
  results = notes.select do |n|
    n['title'].to_s.downcase.include?(query) || n['content'].to_s.downcase.include?(query)
  end
  results.sort_by { |n| -(n['updated_at'] || 0) }.to_json
end
