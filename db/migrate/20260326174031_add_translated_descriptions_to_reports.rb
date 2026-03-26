class AddTranslatedDescriptionsToReports < ActiveRecord::Migration[8.1]
  def change
    add_column :reports, :description_en, :text
    add_column :reports, :description_pt_br, :text
  end
end
