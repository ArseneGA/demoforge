-- Track repos with new commits since last scan
alter table projects add column if not exists has_new_commits boolean not null default false;
